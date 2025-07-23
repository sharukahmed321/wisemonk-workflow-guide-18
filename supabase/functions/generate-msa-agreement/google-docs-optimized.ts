
import { getGoogleAccessToken } from './google-auth.ts';
import { createMSAPlaceholders } from './placeholders.ts';

// Enhanced Google Docs workflow with token caching and better error handling
export async function generateMSAPDFOptimized(
  templateDocId: string, 
  replacements: Record<string, string>
): Promise<Uint8Array> {
  let tempDocId: string | null = null;
  
  try {
    console.log('🔄 Starting optimized MSA PDF generation workflow');
    console.log('📋 Template document ID:', templateDocId);
    
    // Get cached access token
    const accessToken = await getGoogleAccessToken();
    
    // Create temp document with retry logic
    tempDocId = await createDocumentCopyWithRetry(accessToken, templateDocId);
    console.log('✅ Created temporary document:', tempDocId);
    
    // Replace placeholders with batch processing
    await replaceDocumentPlaceholdersBatch(accessToken, tempDocId, replacements);
    console.log('✅ Replaced placeholders in document');
    
    // Export to PDF
    const pdfBuffer = await exportDocumentToPDFWithRetry(accessToken, tempDocId);
    console.log('✅ Exported document to PDF, size:', pdfBuffer.length);
    
    return pdfBuffer;
    
  } finally {
    // Enhanced cleanup with retry logic
    if (tempDocId) {
      await cleanupTemporaryDocumentWithRetry(tempDocId).catch(err => {
        console.warn('⚠️ Failed to delete temporary document:', err.message);
        // Log the orphaned document ID for manual cleanup if needed
        console.warn('🔍 Orphaned document ID for manual cleanup:', tempDocId);
      });
    }
  }
}

async function createDocumentCopyWithRetry(
  accessToken: string, 
  templateDocId: string, 
  maxRetries: number = 2
): Promise<string> {
  const tempDocTitle = `MSA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 Creating document copy (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tempDocTitle,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Enhanced error parsing for Google API errors
        try {
          const errorData = JSON.parse(errorText);
          const googleError = errorData.error;
          
          if (googleError?.code === 403) {
            if (googleError.message?.includes('storage quota') || googleError.message?.includes('storageQuotaExceeded')) {
              throw new Error('Google Drive storage quota exceeded. Please free up space in your Google Drive or create a new service account.');
            } else if (googleError.message?.includes('permission') || googleError.message?.includes('access')) {
              throw new Error('Access denied to Google Drive. Please ensure the service account has proper permissions.');
            }
          } else if (googleError?.code === 404) {
            throw new Error('Template document not found. Please verify the document ID is correct.');
          } else if (googleError?.code === 429) {
            // Rate limit - wait and retry
            if (attempt < maxRetries) {
              const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
              console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }
        } catch (parseError) {
          // If we can't parse the error, use the original
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

async function exportDocumentToPDFWithRetry(
  accessToken: string, 
  documentId: string, 
  maxRetries: number = 2
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
        const errorText = await response.text();
        
        if (response.status === 429 && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
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

async function cleanupTemporaryDocumentWithRetry(
  documentId: string, 
  maxRetries: number = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🗑️ Deleting temporary document (attempt ${attempt}/${maxRetries}):`, documentId);
      
      const accessToken = await getGoogleAccessToken();
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('📄 Document already deleted or not found');
          return;
        }
        
        const errorText = await response.text();
        
        if (response.status === 429 && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw new Error(`Failed to delete document: ${response.status} - ${errorText}`);
      }

      console.log('✅ Document deleted successfully');
      return;
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`⚠️ Cleanup attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
