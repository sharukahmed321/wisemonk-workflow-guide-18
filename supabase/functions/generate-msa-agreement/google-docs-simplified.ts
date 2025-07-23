
// Simplified Google Docs workflow with single authentication
export async function generateMSAPDF(
  accessToken: string, 
  templateDocId: string, 
  replacements: Record<string, string>
): Promise<Uint8Array> {
  let tempDocId: string | null = null;
  
  try {
    console.log('🔄 Starting simplified PDF generation workflow');
    
    // Create temp document
    tempDocId = await createDocumentCopy(accessToken, templateDocId);
    console.log('✅ Created temporary document:', tempDocId);
    
    // Replace placeholders
    await replaceDocumentPlaceholders(accessToken, tempDocId, replacements);
    console.log('✅ Replaced placeholders in document');
    
    // Export to PDF
    const pdfBuffer = await exportDocumentToPDF(accessToken, tempDocId);
    console.log('✅ Exported document to PDF, size:', pdfBuffer.length);
    
    return pdfBuffer;
    
  } finally {
    // Clean up temporary document (good practice, but not critical for storage)
    if (tempDocId) {
      await deleteTemporaryDocument(accessToken, tempDocId).catch(err => {
        console.warn('⚠️ Failed to delete temporary document:', err.message);
      });
    }
  }
}

async function createDocumentCopy(accessToken: string, templateDocId: string): Promise<string> {
  console.log('📄 Creating document copy from template:', templateDocId);
  
  const tempDocTitle = `MSA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
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
    console.error('❌ Failed to copy template document:', response.status, errorText);
    
    // Parse Google API error for better messaging
    try {
      const errorData = JSON.parse(errorText);
      const googleError = errorData.error;
      
      if (googleError?.code === 403) {
        if (googleError.message?.includes('storage quota') || googleError.message?.includes('storageQuotaExceeded')) {
          throw new Error('Google Drive storage quota exceeded. Please free up space in your Google Drive or upgrade your storage plan.');
        } else if (googleError.message?.includes('permission') || googleError.message?.includes('access')) {
          throw new Error('Access denied to Google Drive. Please ensure the service account has proper permissions.');
        }
      } else if (googleError?.code === 404) {
        throw new Error('Template document not found. Please verify the document ID is correct.');
      }
    } catch (parseError) {
      // If we can't parse the error, use the original
    }
    
    throw new Error(`Failed to copy template document: ${response.status} - ${errorText}`);
  }

  const copyResult = await response.json();
  return copyResult.id;
}

async function replaceDocumentPlaceholders(
  accessToken: string, 
  documentId: string, 
  replacements: Record<string, string>
): Promise<void> {
  console.log('🔄 Replacing placeholders in document:', documentId);
  console.log('📝 Placeholders to replace:', Object.keys(replacements));

  const requests = [];

  // Create replace requests for each placeholder
  for (const [placeholder, value] of Object.entries(replacements)) {
    requests.push({
      replaceAllText: {
        containsText: {
          text: placeholder,
          matchCase: true
        },
        replaceText: value || ''
      }
    });
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
}

async function exportDocumentToPDF(accessToken: string, documentId: string): Promise<Uint8Array> {
  console.log('📄 Exporting document to PDF:', documentId);

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Failed to export document as PDF:', response.status, errorText);
    throw new Error(`Failed to export document as PDF: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function deleteTemporaryDocument(accessToken: string, documentId: string): Promise<void> {
  console.log('🗑️ Deleting temporary document:', documentId);

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Failed to delete document:', response.status, errorText);
    throw new Error(`Failed to delete document: ${response.status} - ${errorText}`);
  }

  console.log('✅ Document deleted successfully');
}

// Centralized authentication function
export async function getGoogleAccessToken(): Promise<string> {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountKey) {
    throw new Error('Google Service Account Key not configured');
  }

  const credentials = JSON.parse(serviceAccountKey);
  
  // Get access token
  const jwt = await createJWT(credentials);
  const accessToken = await getAccessToken(jwt);
  
  return accessToken;
}

// Helper functions for JWT and access token (moved from google-docs.ts)
async function createJWT(credentials: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  // Create unsigned token
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Clean and parse private key
  const privateKeyPem = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  // Convert base64 to binary
  const privateKeyBinary = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));

  // Import private key
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBinary,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  // Sign the token
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(unsignedToken)
  );

  // Convert signature to base64url
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsignedToken}.${signatureB64}`;
}

async function getAccessToken(jwt: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Failed to get access token:', response.status, errorText);
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.access_token;
}
