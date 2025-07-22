import { getGoogleAccessToken } from './google-auth.ts';
import { validateStorageBeforeOperation } from './storage-monitor.ts';
import { cleanupOrphanedDocuments, createTempDocumentName, deleteDocumentById } from './cleanup-manager.ts';

export async function generateMSAPDFEnhanced(
  templateDocId: string, 
  replacements: Record<string, string>,
  userData: any
): Promise<Uint8Array> {
  let tempDocId: string | null = null;
  
  try {
    console.log('🔄 Starting enhanced MSA PDF generation workflow');
    
    // Step 1: Validate storage before starting
    await validateStorageBeforeOperation(15); // Estimate 15MB needed
    
    // Step 2: Clean up any orphaned documents from previous runs
    await cleanupOrphanedDocuments();
    
    // Step 3: Get access token
    const accessToken = await getGoogleAccessToken();
    
    // Step 4: Create document copy with enhanced naming
    const tempDocTitle = createTempDocumentName(userData);
    tempDocId = await createDocumentCopyEnhanced(accessToken, templateDocId, tempDocTitle);
    console.log('✅ Created temporary document:', tempDocId);
    
    // Step 5: Replace placeholders
    await replaceDocumentPlaceholdersBatch(accessToken, tempDocId, replacements);
    console.log('✅ Replaced placeholders in document');
    
    // Step 6: Export to PDF
    const pdfBuffer = await exportDocumentToPDFEnhanced(accessToken, tempDocId);
    console.log('✅ Exported document to PDF, size:', pdfBuffer.length);
    
    return pdfBuffer;
    
  } finally {
    // Step 7: Always cleanup, even on failure
    if (tempDocId) {
      try {
        await deleteDocumentById(tempDocId);
        console.log('✅ Temporary document cleaned up successfully');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temporary document:', cleanupError.message);
        console.warn('🔍 Orphaned document ID for manual cleanup:', tempDocId);
      }
    }
  }
}

async function createDocumentCopyEnhanced(
  accessToken: string, 
  templateDocId: string, 
  title: string,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 Creating document copy (attempt ${attempt}/${maxRetries}): ${title}`);
      
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: title })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Parse specific Google API errors
        try {
          const errorData = JSON.parse(errorText);
          const googleError = errorData.error;
          
          if (googleError?.code === 403 && googleError.message?.includes('storage quota')) {
            throw new Error('Google Drive storage quota exceeded. Please free up space or create a new service account.');
          } else if (googleError?.code === 404) {
            throw new Error('Template document not found. Please verify the document ID is correct.');
          } else if (googleError?.code === 429) {
            // Rate limit - wait and retry
            if (attempt < maxRetries) {
              const waitTime = Math.pow(2, attempt) * 1000;
              console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }
        } catch (parseError) {
          // Use original error if parsing fails
        }
        
        throw new Error(`Failed to copy template document: ${response.status} - ${errorText}`);
      }

      const copyResult = await response.json();
      return copyResult.id;
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`⚠️ Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Failed to create document copy after all retries');
}

async function replaceDocumentPlaceholdersBatch(
  accessToken: string, 
  documentId: string, 
  replacements: Record<string, string>
): Promise<void> {
  console.log('🔄 Replacing placeholders in document:', documentId);
  console.log('📝 Placeholders to replace:', Object.keys(replacements));

  const requests = [];

  // Create replace requests for each placeholder
  for (const [placeholder, value] of Object.entries(replacements)) {
    if (value && value.trim()) {
      requests.push({
        replaceAllText: {
          containsText: {
            text: placeholder,
            matchCase: true
          },
          replaceText: value
        }
      });
    }
  }

  if (requests.length === 0) {
    console.log('⏭️ No valid placeholders to replace');
    return;
  }

  const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Failed to replace placeholders:', response.status, errorText);
    throw new Error(`Failed to replace placeholders: ${response.status} - ${errorText}`);
  }

  console.log(`✅ Successfully replaced ${requests.length} placeholders`);
}

async function exportDocumentToPDFEnhanced(
  accessToken: string, 
  documentId: string, 
  maxRetries: number = 3
): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 Exporting document to PDF (attempt ${attempt}/${maxRetries})`);

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (!response.ok) {
        if (response.status === 429 && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        const errorText = await response.text();
        throw new Error(`Failed to export document as PDF: ${response.status} - ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`⚠️ PDF export attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Failed to export PDF after all retries');
}
