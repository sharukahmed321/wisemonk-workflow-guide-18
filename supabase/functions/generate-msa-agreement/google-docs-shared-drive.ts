
import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

export async function generateMSAWithSharedDrive(
  templateDocId: string,
  placeholders: Record<string, string>,
  userData: any
): Promise<Uint8Array> {
  let tempDocId: string | null = null;
  
  try {
    const envValidation = validateAndCorrectEnvironmentVariables();
    if (!envValidation.valid || !envValidation.correctedVars) {
      throw new Error('Environment configuration error');
    }
    
    const { sharedDriveId } = envValidation.correctedVars;
    const accessToken = await getGoogleAccessToken();
    
    // Create document in Shared Drive
    tempDocId = await createDocumentInSharedDrive(accessToken, templateDocId, sharedDriveId, userData);
    
    // Replace placeholders
    await replaceDocumentPlaceholders(accessToken, tempDocId, placeholders);
    
    // Export to PDF
    const pdfBuffer = await exportDocumentToPDF(accessToken, tempDocId);
    
    return pdfBuffer;
    
  } finally {
    // Clean up temporary document
    if (tempDocId) {
      try {
        await deleteDocument(tempDocId);
      } catch (cleanupError) {
        console.error('Failed to cleanup temporary document:', cleanupError.message);
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
  const tempDocTitle = `MSA_${userData.first_name}_${userData.last_name}_${Date.now()}`;
  
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
    throw new Error(`Failed to create document in Shared Drive: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
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
    throw new Error(`Failed to replace placeholders: ${response.status} - ${errorText}`);
  }
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
    throw new Error(`Failed to delete document: ${response.statusText}`);
  }
}
