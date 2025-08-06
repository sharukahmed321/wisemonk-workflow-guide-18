import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

export async function generateEmploymentWithSharedDrive(templateDocId, replacements, userData) {
  let tempDocId = null;
  
  try {
    console.log('🔄 Starting Shared Drive Employment Agreement generation workflow');
    
    // Get validated environment variables
    const envValidation = validateAndCorrectEnvironmentVariables();
    if (!envValidation.correctedVars) {
      throw new Error('Environment validation failed');
    }
    
    const { templateDocId: correctedTemplateId, sharedDriveId } = envValidation.correctedVars;
    
    // Use corrected template ID if provided parameter might be wrong
    const finalTemplateId = correctedTemplateId;
    console.log('📄 Using corrected template document ID:', finalTemplateId);
    console.log('📁 Using Shared Drive ID:', sharedDriveId);
    
    const accessToken = await getGoogleAccessToken();
    
    // Verify we have the correct IDs
    if (finalTemplateId === sharedDriveId) {
      throw new Error(`Template document ID cannot be the same as Shared Drive ID. Template: ${finalTemplateId}, Drive: ${sharedDriveId}`);
    }
    
    // Step 1: Create document copy in the Shared Drive
    console.log('🔄 Creating Employment Agreement copy in Shared Drive...');
    tempDocId = await createEmploymentDocumentInSharedDrive(
      accessToken, 
      finalTemplateId, 
      sharedDriveId, 
      createTempEmploymentDocumentName(userData)
    );
    console.log('✅ Employment Agreement created in Shared Drive:', tempDocId);
    
    // Step 2: Replace placeholders
    console.log('🔄 Replacing placeholders in Shared Drive Employment Agreement...');
    await replaceDocumentPlaceholders(accessToken, tempDocId, replacements);
    console.log('✅ Employment Agreement placeholders replaced successfully');
    
    // Step 3: Export to PDF
    console.log('🔄 Exporting Shared Drive Employment Agreement to PDF...');
    const pdfBuffer = await exportDocumentToPDF(accessToken, tempDocId);
    console.log('✅ Employment Agreement PDF exported successfully, size:', pdfBuffer.length);
    
    return pdfBuffer;
    
  } finally {
    // Step 4: Always cleanup, even on failure
    if (tempDocId) {
      try {
        const accessToken = await getGoogleAccessToken();
        const envValidation = validateAndCorrectEnvironmentVariables();
        if (envValidation.correctedVars) {
          const { sharedDriveId } = envValidation.correctedVars;
          await deleteDocumentFromSharedDrive(accessToken, tempDocId, sharedDriveId);
          console.log('✅ Shared Drive Employment Agreement cleanup completed');
        }
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup Shared Drive Employment Agreement:', cleanupError.message);
        console.warn('🔍 Orphaned Employment Agreement ID for manual cleanup:', tempDocId);
      }
    }
  }
}

async function createEmploymentDocumentInSharedDrive(accessToken, templateDocId, sharedDriveId, documentName, maxRetries = 3) {
  // Triple-check we have the right IDs before proceeding
  console.log(`🔍 === PRE-COPY VALIDATION (Employment Agreement) ===`);
  console.log(`📄 Template Document ID: "${templateDocId}"`);
  console.log(`📁 Shared Drive ID: "${sharedDriveId}"`);
  console.log(`📝 Employment Agreement Name: "${documentName}"`);
  
  // CRITICAL VALIDATION
  if (!templateDocId || !sharedDriveId) {
    throw new Error(`Missing required IDs for Employment Agreement: template="${templateDocId}", drive="${sharedDriveId}"`);
  }
  
  if (templateDocId === sharedDriveId) {
    throw new Error(`FATAL: Employment Agreement template ID (${templateDocId}) cannot be the same as Shared Drive ID (${sharedDriveId})`);
  }
  
  if (templateDocId.startsWith('0A')) {
    throw new Error(`FATAL: Employment Agreement template ID looks like a Drive ID (starts with 0A): ${templateDocId}. Expected a Docs ID starting with 1.`);
  }
  
  if (!sharedDriveId.startsWith('0A')) {
    throw new Error(`FATAL: Shared Drive ID should start with 0A: ${sharedDriveId}`);
  }
  
  console.log('✅ Pre-copy validation passed for Employment Agreement');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 Creating Employment Agreement in Shared Drive (attempt ${attempt}/${maxRetries}): ${documentName}`);
      console.log(`📋 CONFIRMED - Copying FROM Employment Agreement template: ${templateDocId}`);
      console.log(`📁 CONFIRMED - Copying TO Shared Drive: ${sharedDriveId}`);
      
      // CRITICAL: Final verification before API call
      const copyUrl = `https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`;
      console.log(`🔗 API URL: ${copyUrl}`);
      
      if (copyUrl.includes('0AJLtAJTQC6NLUk9PVA/copy')) {
        throw new Error('FATAL: Copy URL contains Shared Drive ID instead of Employment Agreement template ID!');
      }
      
      const response = await fetch(`${copyUrl}?supportsAllDrives=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: documentName,
          parents: [sharedDriveId],
          supportsAllDrives: true
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Employment Agreement copy operation failed. Request details:`);
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
              throw new Error(`Employment Agreement template document not found: ${templateDocId}. Please verify the DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID or DEFAULT_GOOGLE_DOC_ID is correct and the document exists. Make sure the service account has access to this document.`);
            } else if (errorMessage.includes(sharedDriveId) || errorMessage.includes('parent') || errorMessage.includes('drive')) {
              throw new Error(`Shared Drive not found: ${sharedDriveId}. Please verify the GOOGLE_SHARED_DRIVE_ID is correct and the service account has access to this Shared Drive.`);
            } else {
              throw new Error(`Resource not found (404). This could be the Employment Agreement template document (${templateDocId}) or Shared Drive (${sharedDriveId}). Please verify both IDs are correct and accessible.`);
            }
          } else if (googleError?.code === 403) {
            const errorMessage = googleError.message || '';
            if (errorMessage.toLowerCase().includes('drive') || errorMessage.toLowerCase().includes('shared')) {
              throw new Error(`Access denied to Shared Drive (${sharedDriveId}). Please ensure the service account has Editor permissions on the Shared Drive. Service account email should be added as a member with Editor access.`);
            } else {
              throw new Error(`Access denied to Employment Agreement template document (${templateDocId}). Please ensure the service account has Viewer permissions on the template document. Share the document with the service account email.`);
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
            throw new Error(`Invalid request: ${googleError.message}. This may indicate configuration issues with the Shared Drive or Employment Agreement template document IDs.`);
          }
        } catch (parseError) {
          // Use original error if parsing fails
          console.warn('⚠️ Could not parse Google API error response');
        }
        
        throw new Error(`Failed to create Employment Agreement in Shared Drive: ${response.status} - ${errorText}`);
      }
      
      const copyData = await response.json();
      console.log(`✅ Successfully created Employment Agreement copy: ${copyData.id}`);
      return copyData.id;
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Don't retry configuration errors (404, 403)
      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        throw error;
      }
      
      console.log(`⚠️ Employment Agreement attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Failed to create Employment Agreement in Shared Drive after all retries');
}

async function replaceDocumentPlaceholders(accessToken, docId, replacements) {
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

async function exportDocumentToPDF(accessToken, docId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 Exporting Shared Drive Employment Agreement to PDF (attempt ${attempt}/${maxRetries})`);
      
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
        throw new Error(`Failed to export Employment Agreement as PDF: ${response.status} - ${errorText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`⚠️ Employment Agreement PDF export attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Failed to export Employment Agreement PDF after all retries');
}

async function deleteDocumentFromSharedDrive(accessToken, docId, sharedDriveId) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}?supportsAllDrives=true`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Failed to delete Employment Agreement from Shared Drive: ${response.status} - ${errorText}`);
  }
}

function createTempEmploymentDocumentName(userData) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const safeName = `${userData.first_name || 'User'}_${userData.last_name || 'Document'}`.replace(/[^a-zA-Z0-9]/g, '_');
  return `Employment_Agreement_SharedDrive_${safeName}_${timestamp}_${randomId}`;
}