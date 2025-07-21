
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
  
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: title,
      parents: [], // Copy to root folder
      mimeType: 'application/vnd.google-apps.document'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create document copy: ${response.statusText}`);
  }

  const result = await response.json();
  
  // Copy content from template
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
    throw new Error(`Failed to copy template document: ${copyResponse.statusText}`);
  }

  const copyResult = await copyResponse.json();
  return copyResult.id;
};

export const replacePlaceholdersInDoc = async (docId: string, msaData: any): Promise<void> => {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  const credentials = JSON.parse(serviceAccountKey);
  
  const jwt = await createJWT(credentials);
  const accessToken = await getAccessToken(jwt);

  const placeholders = createMSAPlaceholders(msaData);
  const requests = [];

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
    throw new Error(`Failed to replace placeholders: ${response.statusText}`);
  }
};

export const exportDocAsPDF = async (docId: string): Promise<ArrayBuffer> => {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  const credentials = JSON.parse(serviceAccountKey);
  
  const jwt = await createJWT(credentials);
  const accessToken = await getAccessToken(jwt);

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to export document as PDF: ${response.statusText}`);
  }

  return await response.arrayBuffer();
};

export const deleteDocument = async (docId: string): Promise<void> => {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  const credentials = JSON.parse(serviceAccountKey);
  
  const jwt = await createJWT(credentials);
  const accessToken = await getAccessToken(jwt);

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete document: ${response.statusText}`);
  }
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

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const key = await crypto.subtle.importKey(
    'pkcs8',
    new Uint8Array(atob(credentials.private_key.replace(/-----BEGIN PRIVATE KEY-----|\n|-----END PRIVATE KEY-----/g, '')).split('').map(c => c.charCodeAt(0))),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
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
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const result = await response.json();
  return result.access_token;
}

// Import placeholder functions
import { createMSAPlaceholders } from './placeholders.ts';
