import { encode as base64urlEncode } from "https://deno.land/std@0.168.0/encoding/base64url.ts";

// Cache for access token to avoid regenerating on every request
let cachedToken = null;

export async function getGoogleAccessToken() {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiry) {
    console.log('🔄 Using cached access token');
    return cachedToken.token;
  }
  
  console.log('🔑 Generating new access token...');
  
  const serviceAccountKeyJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountKeyJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set');
  }
  
  let serviceAccountKey;
  try {
    serviceAccountKey = JSON.parse(serviceAccountKeyJson);
  } catch (error) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format: ' + error.message);
  }
  
  // Create JWT token
  const jwt = await createJWT(serviceAccountKey);
  
  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.statusText}. ${errorText}`);
  }
  
  const data = await response.json();
  
  // Cache the token (expires in 1 hour, cache for 55 minutes to be safe)
  cachedToken = {
    token: data.access_token,
    expiry: Date.now() + (55 * 60 * 1000) // 55 minutes
  };
  
  console.log('✅ Access token generated successfully');
  return data.access_token;
}

async function createJWT(serviceAccountKey) {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // Token expires in 1 hour
  
  // JWT Header
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  // JWT Payload with required Google API scopes for Documents and Drive
  const payload = {
    iss: serviceAccountKey.client_email,
    scope: 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now
  };
  
  // Encode header and payload
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  
  // Create signature
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await signRSA256(signingInput, serviceAccountKey.private_key);
  
  return `${signingInput}.${signature}`;
}

async function signRSA256(data, privateKey) {
  try {
    // Clean up the private key format
    const cleanPrivateKey = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    
    // Convert base64 to binary
    const binaryKey = atob(cleanPrivateKey);
    const keyBytes = new Uint8Array(binaryKey.length);
    for (let i = 0; i < binaryKey.length; i++) {
      keyBytes[i] = binaryKey.charCodeAt(i);
    }
    
    // Import the private key
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBytes.buffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );
    
    // Sign the data
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, dataBytes);
    
    // Convert signature to base64url
    const signatureBytes = new Uint8Array(signatureBuffer);
    return base64urlEncode(signatureBytes);
    
  } catch (error) {
    throw new Error(`Failed to sign JWT: ${error.message}`);
  }
}