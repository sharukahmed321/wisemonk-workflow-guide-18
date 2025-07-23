
import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

export async function generateMSAWithSharedDrive(
  templateDocId: string,
  placeholders: Record<string, string>,
  userData: any
): Promise<Uint8Array> {
  let tempDocId: string | null = null;
  
  try {
    console.log('🚀 Starting MSA generation with Shared Drive workflow...');
    
    // Get environment variables with enhanced validation
    const envValidation = validateAndCorrectEnvironmentVariables();
    if (!envValidation.valid || !envValidation.correctedVars) {
      console.error('❌ Environment configuration error:', envValidation.issues);
      throw new Error(`Environment configuration error: ${envValidation.issues.join('; ')}`);
    }
    
    const { sharedDriveId, templateDocId: validatedTemplateDocId } = envValidation.correctedVars;
    
    // Use the validated template doc ID instead of the passed parameter
    const finalTemplateDocId = validatedTemplateDocId;
    
    console.log('📋 Using validated IDs:');
    console.log('  Template Document ID:', finalTemplateDocId);
    console.log('  Shared Drive ID:', sharedDriveId);
    
    const accessToken = await getGoogleAccessToken();
    console.log('✅ Authentication successful');
    
    // Create document in Shared Drive
    console.log('📄 Creating document in Shared Drive...');
    tempDocId = await createDocumentInSharedDrive(accessToken, finalTemplateDocId, sharedDriveId, userData);
    console.log('✅ Document created successfully:', tempDocId);
    
    // Replace placeholders
    console.log('🔄 Replacing placeholders...');
    await replaceDocumentPlaceholders(accessToken, tempDocId, placeholders);
    console.log('✅ Placeholders replaced successfully');
    
    // Export to PDF
    console.log('📄 Exporting to PDF...');
    const pdfBuffer = await exportDocumentToPDF(accessToken, tempDocId);
    console.log('✅ PDF export successful, size:', pdfBuffer.byteLength);
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ MSA generation failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      templateDocId,
      tempDocId
    });
    throw error;
  } finally {
    // Clean up temporary document
    if (tempDocId) {
      try {
        console.log('🗑️ Cleaning up temporary document...');
        await deleteDocument(tempDocId);
        console.log('✅ Temporary document cleaned up');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temporary document:', cleanupError.message);
      }
    }
  }
}

async function createDocumentInSharedDrive(
  accessToken: string,
  templateDocId: string,
  sharedDriveId: string,
  userData: any
): Promise<string> {
  const tempDocTitle = `MSA_SharedDrive_${userData.first_name}_${userData.last_name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('📄 Creating document with details:');
  console.log('  Title:', tempDocTitle);
  console.log('  Template ID:', templateDocId);
  console.log('  Shared Drive ID:', sharedDriveId);
  
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: tempDocTitle,
      parents: [sharedDriveId]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Failed to create document in Shared Drive:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      templateDocId,
      sharedDriveId
    });
    throw new Error(`Failed to create document in Shared Drive: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Document created successfully:', result.id);
  return result.id;
}

async function replaceDocumentPlaceholders(
  accessToken: string,
  documentId: string,
  placeholders: Record<string, string>
): Promise<void> {
  const requests = [];

  for (const [placeholder, value] of Object.entries(placeholders)) {
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
    console.log('⚠️ No placeholders to replace');
    return;
  }

  console.log(`🔄 Processing ${requests.length} placeholder replacements...`);

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
    console.error('❌ Failed to replace placeholders:', {
      status: response.status,
      error: errorText,
      documentId
    });
    throw new Error(`Failed to replace placeholders: ${response.status} - ${errorText}`);
  }

  console.log('✅ Placeholders replaced successfully');
}

async function exportDocumentToPDF(accessToken: string, documentId: string): Promise<Uint8Array> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Failed to export document as PDF:', {
      status: response.status,
      error: errorText,
      documentId
    });
    throw new Error(`Failed to export document as PDF: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function deleteDocument(documentId: string): Promise<void> {
  const accessToken = await getGoogleAccessToken();
  
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok && response.status !== 404) {
    console.error('❌ Failed to delete document:', {
      status: response.status,
      documentId
    });
    throw new Error(`Failed to delete document: ${response.statusText}`);
  }
}
