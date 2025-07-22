import { getGoogleAccessToken } from './google-auth.ts';

export interface SharedDriveInfo {
  id: string;
  name: string;
  capabilities?: any;
  restrictions?: any;
}

export interface SharedDriveTestResult {
  success: boolean;
  driveInfo?: SharedDriveInfo;
  error?: string;
}

// CRITICAL: Environment variable validation
function validateAndGetCorrectIds() {
  console.log('🔍 === GOOGLE DOCS SHARED DRIVE ID VALIDATION ===');
  
  const rawTemplateDocId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID');
  const rawSharedDriveId = Deno.env.get('GOOGLE_SHARED_DRIVE_ID');
  
  console.log(`📄 Raw DEFAULT_GOOGLE_DOC_ID: "${rawTemplateDocId}"`);
  console.log(`📁 Raw GOOGLE_SHARED_DRIVE_ID: "${rawSharedDriveId}"`);
  
  // CRITICAL FIX: Force the correct IDs based on known values
  const CORRECT_TEMPLATE_DOC_ID = '1GyU3aCxwQIm69Y3ql_rcTU0jp2HKZNQeIlvFNVBc94o';
  const CORRECT_SHARED_DRIVE_ID = '0AJLtAJTQC6NLUk9PVA';
  
  let templateDocId = rawTemplateDocId;
  let sharedDriveId = rawSharedDriveId;
  
  // CRITICAL: Check if template ID is incorrectly set to shared drive ID
  if (rawTemplateDocId === CORRECT_SHARED_DRIVE_ID) {
    console.error('💥 CRITICAL ERROR: DEFAULT_GOOGLE_DOC_ID is set to the Shared Drive ID!');
    console.error(`🔧 CORRECTING: Using correct template ID: ${CORRECT_TEMPLATE_DOC_ID}`);
    templateDocId = CORRECT_TEMPLATE_DOC_ID;
  }
  
  // Fallback to correct values if missing
  if (!templateDocId) {
    console.error('💥 Template ID missing, using fallback');
    templateDocId = CORRECT_TEMPLATE_DOC_ID;
  }
  
  if (!sharedDriveId) {
    console.error('💥 Shared Drive ID missing, using fallback');
    sharedDriveId = CORRECT_SHARED_DRIVE_ID;
  }
  
  // Final check
  if (templateDocId === sharedDriveId) {
    console.error('💥 IDs are still the same after correction!');
    templateDocId = CORRECT_TEMPLATE_DOC_ID;
    sharedDriveId = CORRECT_SHARED_DRIVE_ID;
  }
  
  console.log('✅ === FINAL CORRECTED IDs ===');
  console.log(`📄 Template Document ID: "${templateDocId}"`);
  console.log(`📁 Shared Drive ID: "${sharedDriveId}"`);
  console.log(`🔍 Different? ${templateDocId !== sharedDriveId ? 'YES ✅' : 'NO ❌'}`);
  console.log('===================================');
  
  return { templateDocId, sharedDriveId };
}

export async function generateMSAWithSharedDrive(
  templateDocId: string, 
  replacements: Record<string, string>,
  userData: any
): Promise<Uint8Array> {
  let tempDocId: string | null = null;
  
  try {
    console.log('🔄 Starting Shared Drive MSA generation workflow');
    
    // CRITICAL: Validate and get correct IDs
    const { templateDocId: correctedTemplateId, sharedDriveId } = validateAndGetCorrectIds();
    
    // Use the corrected template ID, not the passed parameter
    console.log('📄 Using corrected template document ID:', correctedTemplateId);
    console.log('📁 Using Shared Drive ID:', sharedDriveId);
    
    const accessToken = await getGoogleAccessToken();

    // Verify we have the correct IDs
    if (correctedTemplateId === sharedDriveId) {
      throw new Error(`Template document ID cannot be the same as Shared Drive ID. Template: ${correctedTemplateId}, Drive: ${sharedDriveId}`);
    }

    // Step 1: Create document copy in the Shared Drive
    console.log('🔄 Creating document copy in Shared Drive...');
    tempDocId = await createDocumentInSharedDrive(
      accessToken, 
      correctedTemplateId,  // Use the corrected template ID
      sharedDriveId,  // This should be the Shared Drive ID
      createTempDocumentName(userData)
    );
    
    console.log('✅ Document created in Shared Drive:', tempDocId);

    // Step 2: Replace placeholders
    console.log('🔄 Replacing placeholders in Shared Drive document...');
    await replaceDocumentPlaceholders(accessToken, tempDocId, replacements);
    console.log('✅ Placeholders replaced successfully');

    // Step 3: Export to PDF
    console.log('🔄 Exporting Shared Drive document to PDF...');
    const pdfBuffer = await exportDocumentToPDF(accessToken, tempDocId);
    console.log('✅ PDF exported successfully, size:', pdfBuffer.length);

    return pdfBuffer;

  } finally {
    // Step 4: Always cleanup, even on failure
    if (tempDocId) {
      try {
        const accessToken = await getGoogleAccessToken();
        const { sharedDriveId } = validateAndGetCorrectIds();
        await deleteDocumentFromSharedDrive(accessToken, tempDocId, sharedDriveId);
        console.log('✅ Shared Drive document cleanup completed');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup Shared Drive document:', cleanupError.message);
        console.warn('🔍 Orphaned document ID for manual cleanup:', tempDocId);
      }
    }
  }
}

async function createDocumentInSharedDrive(
  accessToken: string, 
  templateDocId: string,   // This MUST be the Google Docs template ID
  sharedDriveId: string,   // This MUST be the Shared Drive ID
  documentName: string,
  maxRetries: number = 3
): Promise<string> {
  
  // Triple-check we have the right IDs before proceeding
  console.log(`🔍 === PRE-COPY VALIDATION ===`);
  console.log(`📄 Template Document ID: "${templateDocId}"`);
  console.log(`📁 Shared Drive ID: "${sharedDriveId}"`);
  console.log(`📝 Document Name: "${documentName}"`);
  
  // CRITICAL VALIDATION
  if (!templateDocId || !sharedDriveId) {
    throw new Error(`Missing required IDs: template="${templateDocId}", drive="${sharedDriveId}"`);
  }
  
  if (templateDocId === sharedDriveId) {
    throw new Error(`FATAL: Template document ID (${templateDocId}) cannot be the same as Shared Drive ID (${sharedDriveId})`);
  }
  
  if (templateDocId.startsWith('0A')) {
    throw new Error(`FATAL: Template ID looks like a Drive ID (starts with 0A): ${templateDocId}. Expected a Docs ID starting with 1.`);
  }
  
  if (!sharedDriveId.startsWith('0A')) {
    throw new Error(`FATAL: Shared Drive ID should start with 0A: ${sharedDriveId}`);
  }
  
  console.log('✅ Pre-copy validation passed');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 Creating document in Shared Drive (attempt ${attempt}/${maxRetries}): ${documentName}`);
      console.log(`📋 CONFIRMED - Copying FROM template: ${templateDocId}`);
      console.log(`📁 CONFIRMED - Copying TO Shared Drive: ${sharedDriveId}`);
      
      // CRITICAL: Final verification before API call
      const copyUrl = `https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`;
      console.log(`🔗 API URL: ${copyUrl}`);
      
      if (copyUrl.includes('0AJLtAJTQC6NLUk9PVA/copy')) {
        throw new Error('FATAL: Copy URL contains Shared Drive ID instead of template ID!');
      }
      
      const response = await fetch(`${copyUrl}?supportsAllDrives=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: documentName,
          parents: [sharedDriveId],  // This is correct - copying TO the Shared Drive
          supportsAllDrives: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Copy operation failed. Request details:`);
        console.error(`   📄 Source (template): ${templateDocId}`);
        console.error(`   📁 Destination (drive): ${sharedDriveId}`);
        console.error(`   🔗 API URL: ${copyUrl}`);
        console.error(`   📝 Response: ${errorText}`);
        
        // Parse specific Google API errors
        try {
          const errorData = JSON.parse(errorText);
          const googleError = errorData.error;
          
          if (googleError?.code === 404) {
            // Check which resource was not found by examining the error message
            const errorMessage = googleError.message || errorText;
            
            if (errorMessage.includes(templateDocId) || errorMessage.includes('source file')) {
              throw new Error(`Template document not found: ${templateDocId}. Please verify the DEFAULT_GOOGLE_DOC_ID is correct and the document exists. Make sure the service account has access to this document.`);
            } else if (errorMessage.includes(sharedDriveId) || errorMessage.includes('parent') || errorMessage.includes('drive')) {
              throw new Error(`Shared Drive not found: ${sharedDriveId}. Please verify the GOOGLE_SHARED_DRIVE_ID is correct and the service account has access to this Shared Drive.`);
            } else {
              throw new Error(`Resource not found (404). This could be the template document (${templateDocId}) or Shared Drive (${sharedDriveId}). Please verify both IDs are correct and accessible.`);
            }
          } else if (googleError?.code === 403) {
            const errorMessage = googleError.message || '';
            
            if (errorMessage.toLowerCase().includes('drive') || errorMessage.toLowerCase().includes('shared')) {
              throw new Error(`Access denied to Shared Drive (${sharedDriveId}). Please ensure the service account has Editor permissions on the Shared Drive. Service account email should be added as a member with Editor access.`);
            } else {
              throw new Error(`Access denied to template document (${templateDocId}). Please ensure the service account has Viewer permissions on the template document. Share the document with the service account email.`);
            }
          } else if (googleError?.code === 429) {
            // Rate limit - wait and retry
            if (attempt < maxRetries) {
              const waitTime = Math.pow(2, attempt) * 1000;
              console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
            throw new Error('Google API rate limit exceeded. Please try again in a few moments.');
          } else if (googleError?.code === 400) {
            throw new Error(`Invalid request: ${googleError.message}. This may indicate configuration issues with the Shared Drive or template document IDs.`);
          }
        } catch (parseError) {
          // Use original error if parsing fails
          console.warn('⚠️ Could not parse Google API error response');
        }
        
        throw new Error(`Failed to create document in Shared Drive: ${response.status} - ${errorText}`);
      }

      const copyData = await response.json();
      console.log(`✅ Successfully created document copy: ${copyData.id}`);
      return copyData.id;
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Don't retry configuration errors (404, 403)
      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        throw error;
      }
      
      console.log(`⚠️ Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Failed to create document in Shared Drive after all retries');
}

async function replaceDocumentPlaceholders(
  accessToken: string, 
  docId: string, 
  replacements: Record<string, string>
): Promise<void> {
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

  const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
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

async function exportDocumentToPDF(
  accessToken: string, 
  docId: string,
  maxRetries: number = 3
): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 Exporting Shared Drive document to PDF (attempt ${attempt}/${maxRetries})`);

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
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

async function deleteDocumentFromSharedDrive(
  accessToken: string, 
  docId: string, 
  sharedDriveId: string
): Promise<void> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}?supportsAllDrives=true`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Failed to delete document from Shared Drive: ${response.status} - ${errorText}`);
  }
}

export async function getSharedDriveInfo(
  accessToken: string, 
  sharedDriveId: string
): Promise<SharedDriveInfo> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Shared Drive info: ${response.status} - ${errorText}`);
  }

  const driveData = await response.json();
  
  return {
    id: driveData.id,
    name: driveData.name,
    capabilities: driveData.capabilities,
    restrictions: driveData.restrictions
  };
}

export async function listSharedDrives(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/drive/v3/drives', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list Shared Drives: ${response.status} - ${errorText}`);
  }

  const drivesData = await response.json();
  
  return drivesData.drives?.map((drive: any) => ({
    id: drive.id,
    name: drive.name,
    created: drive.createdTime
  })) || [];
}

export async function testSharedDriveAccess(
  accessToken: string, 
  sharedDriveId: string
): Promise<SharedDriveTestResult> {
  try {
    console.log('🔍 Testing Shared Drive access...');
    
    // Test 1: Can we access the drive?
    const driveInfo = await getSharedDriveInfo(accessToken, sharedDriveId);
    console.log('✅ Can access Shared Drive:', driveInfo.name);
    
    // Test 2: Can we list files in the drive?
    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&pageSize=10`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log(`✅ Can list files in Shared Drive (${listData.files?.length || 0} files found)`);
    } else {
      console.warn('⚠️ Cannot list files in Shared Drive');
    }
    
    // Test 3: Can we create a test document?
    const testResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'test-shared-drive-access',
        parents: [sharedDriveId],
        mimeType: 'application/vnd.google-apps.document',
        supportsAllDrives: true
      })
    });
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Can create documents in Shared Drive');
      
      // Clean up test document
      await deleteDocumentFromSharedDrive(accessToken, testData.id, sharedDriveId);
      console.log('✅ Can delete documents from Shared Drive');
    } else {
      const errorText = await testResponse.text();
      console.error('❌ Cannot create documents in Shared Drive:', errorText);
    }
    
    return { success: true, driveInfo };
    
  } catch (error) {
    console.error('❌ Shared Drive access test failed:', error);
    return { success: false, error: error.message };
  }
}

function createTempDocumentName(userData: any): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const safeName = `${userData.first_name || 'User'}_${userData.last_name || 'Document'}`.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `MSA_SharedDrive_${safeName}_${timestamp}_${randomId}`;
}

export async function cleanupSharedDriveOrphanedDocuments(): Promise<void> {
  try {
    console.log('🗑️ Starting cleanup of orphaned Shared Drive documents...');
    const accessToken = await getGoogleAccessToken();
    const { sharedDriveId } = validateAndGetCorrectIds();
    
    if (!sharedDriveId) {
      console.warn('⚠️ GOOGLE_SHARED_DRIVE_ID not configured, skipping Shared Drive cleanup');
      return;
    }
    
    // Search for temporary MSA documents older than 24 hours in the Shared Drive
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const query = `name contains 'MSA_SharedDrive_' and createdTime < '${oneDayAgo}' and trashed = false`;
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&fields=files(id,name,createdTime)`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      console.warn('⚠️ Could not search for orphaned Shared Drive documents:', response.statusText);
      return;
    }

    const data = await response.json();
    const orphanedFiles = data.files || [];
    
    console.log(`🔍 Found ${orphanedFiles.length} potential orphaned Shared Drive documents`);
    
    if (orphanedFiles.length === 0) {
      console.log('✅ No orphaned Shared Drive documents found');
      return;
    }

    let deletedCount = 0;
    for (const file of orphanedFiles) {
      try {
        await deleteDocumentFromSharedDrive(accessToken, file.id, sharedDriveId);
        console.log(`🗑️ Deleted orphaned Shared Drive document: ${file.name} (${file.id})`);
        deletedCount++;
      } catch (error) {
        console.warn(`⚠️ Failed to delete orphaned Shared Drive document ${file.name}:`, error.message);
      }
    }
    
    console.log(`✅ Shared Drive cleanup completed: ${deletedCount}/${orphanedFiles.length} documents deleted`);
    
  } catch (error) {
    console.warn('⚠️ Shared Drive cleanup process failed:', error.message);
  }
}
