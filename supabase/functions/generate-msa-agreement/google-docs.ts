
export const createDocumentCopy = async (templateDocId: string, title: string): Promise<string> => {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountKey) {
    throw new Error('Google Service Account Key not configured');
  }

  const credentials = JSON.parse(serviceAccountKey);
  
  // Get access token
  const jwt = await createJWT(credentials);
  const accessToken = await getAccessToken(jwt);

  console.log('📄 Creating document copy with title:', title);
  console.log('📋 Using template document ID:', templateDocId);
  
  // Copy the template document
  const copyResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: title,
    })
  });

  if (!copyResponse.ok) {
    const errorText = await copyResponse.text();
    console.error('❌ Failed to copy template document:', copyResponse.status, errorText);
    throw new Error(`Failed to copy template document: ${copyResponse.status} - ${errorText}`);
  }

  const copyResult = await copyResponse.json();
  console.log('✅ Document copied successfully with ID:', copyResult.id);
  return copyResult.id;
};

export const replacePlaceholdersInDoc = async (docId: string, msaData: any): Promise<void> => {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountKey) {
    throw new Error('Google Service Account Key not configured');
  }

  const credentials = JSON.parse(serviceAccountKey);
  
  const jwt = await createJWT(credentials);
  const accessToken = await getAccessToken(jwt);

  const placeholders = createMSAPlaceholders(msaData);
  const requests = [];

  console.log('🔄 Replacing placeholders in document:', docId);
  console.log('📝 Placeholders to replace:', Object.keys(placeholders));

  // Create replace requests for each placeholder
  for (const [placeholder, value] of Object.entries(placeholders)) {
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

  const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
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

  console.log('✅ Placeholders replaced successfully');
};

export const exportDocAsPDF = async (docId: string): Promise<ArrayBuffer> => {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountKey) {
    throw new Error('Google Service Account Key not configured');
  }

  const credentials = JSON.parse(serviceAccountKey);
  
  const jwt = await createJWT(credentials);
  const accessToken = await getAccessToken(jwt);

  console.log('📄 Exporting document as PDF:', docId);

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`, {
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

  const pdfBuffer = await response.arrayBuffer();
  console.log('✅ Document exported as PDF successfully, size:', pdfBuffer.byteLength);
  return pdfBuffer;
};

export const deleteDocument = async (docId: string): Promise<void> => {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountKey) {
    throw new Error('Google Service Account Key not configured');
  }

  const credentials = JSON.parse(serviceAccountKey);
  
  const jwt = await createJWT(credentials);
  const accessToken = await getAccessToken(jwt);

  console.log('🗑️ Deleting temporary document:', docId);

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}`, {
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
};

// Helper functions for JWT and access token
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

// Import placeholder functions
import { createMSAPlaceholders } from './placeholders.ts';
