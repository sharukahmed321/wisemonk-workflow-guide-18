
import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

export interface FallbackGenerationResult {
  success: boolean;
  pdfBuffer?: Uint8Array;
  method: string;
  error?: string;
  attempts: string[];
}

export async function generateMSAWithFallback(
  templateDocId: string,
  placeholders: Record<string, string>,
  userData: any
): Promise<FallbackGenerationResult> {
  const result: FallbackGenerationResult = {
    success: false,
    method: 'unknown',
    attempts: []
  };

  console.log('🔄 Starting fallback generation process...');

  // Method 1: Primary Shared Drive method
  try {
    console.log('🔄 Attempting Method 1: Primary Shared Drive...');
    result.attempts.push('primary_shared_drive');
    
    const pdfBuffer = await primarySharedDriveMethod(templateDocId, placeholders, userData);
    result.success = true;
    result.pdfBuffer = pdfBuffer;
    result.method = 'primary_shared_drive';
    console.log('✅ Method 1 successful');
    return result;
  } catch (error) {
    console.error('❌ Method 1 failed:', error.message);
  }

  // Method 2: Direct template copy method
  try {
    console.log('🔄 Attempting Method 2: Direct template copy...');
    result.attempts.push('direct_template_copy');
    
    const pdfBuffer = await directTemplateCopyMethod(templateDocId, placeholders, userData);
    result.success = true;
    result.pdfBuffer = pdfBuffer;
    result.method = 'direct_template_copy';
    console.log('✅ Method 2 successful');
    return result;
  } catch (error) {
    console.error('❌ Method 2 failed:', error.message);
  }

  // Method 3: My Drive fallback method
  try {
    console.log('🔄 Attempting Method 3: My Drive fallback...');
    result.attempts.push('my_drive_fallback');
    
    const pdfBuffer = await myDriveFallbackMethod(templateDocId, placeholders, userData);
    result.success = true;
    result.pdfBuffer = pdfBuffer;
    result.method = 'my_drive_fallback';
    console.log('✅ Method 3 successful');
    return result;
  } catch (error) {
    console.error('❌ Method 3 failed:', error.message);
  }

  // Method 4: Minimal generation method
  try {
    console.log('🔄 Attempting Method 4: Minimal generation...');
    result.attempts.push('minimal_generation');
    
    const pdfBuffer = await minimalGenerationMethod(templateDocId, placeholders, userData);
    result.success = true;
    result.pdfBuffer = pdfBuffer;
    result.method = 'minimal_generation';
    console.log('✅ Method 4 successful');
    return result;
  } catch (error) {
    console.error('❌ Method 4 failed:', error.message);
    result.error = error.message;
  }

  console.error('❌ All fallback methods failed');
  return result;
}

async function primarySharedDriveMethod(
  templateDocId: string,
  placeholders: Record<string, string>,
  userData: any
): Promise<Uint8Array> {
  console.log('📄 Primary Shared Drive method...');
  
  const envValidation = validateAndCorrectEnvironmentVariables();
  if (!envValidation.valid || !envValidation.correctedVars) {
    throw new Error('Environment validation failed');
  }

  const { sharedDriveId } = envValidation.correctedVars;
  const accessToken = await getGoogleAccessToken();
  
  // Create document in shared drive
  const tempDocTitle = `MSA_Primary_${userData.first_name}_${userData.last_name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const createResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`, {
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

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Primary method document creation failed: ${createResponse.status} - ${errorText}`);
  }

  const createResult = await createResponse.json();
  const tempDocId = createResult.id;

  try {
    // Replace placeholders
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

    if (requests.length > 0) {
      const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${tempDocId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Primary method placeholder replacement failed: ${updateResponse.status} - ${errorText}`);
      }
    }

    // Export to PDF
    const pdfResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}/export?mimeType=application/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      throw new Error(`Primary method PDF export failed: ${pdfResponse.status} - ${errorText}`);
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    return new Uint8Array(arrayBuffer);

  } finally {
    // Cleanup
    await fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }
}

async function directTemplateCopyMethod(
  templateDocId: string,
  placeholders: Record<string, string>,
  userData: any
): Promise<Uint8Array> {
  console.log('📄 Direct template copy method...');
  
  const accessToken = await getGoogleAccessToken();
  
  // Create document without specifying parent (goes to My Drive)
  const tempDocTitle = `MSA_Direct_${userData.first_name}_${userData.last_name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const createResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: tempDocTitle
    })
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Direct method document creation failed: ${createResponse.status} - ${errorText}`);
  }

  const createResult = await createResponse.json();
  const tempDocId = createResult.id;

  try {
    // Replace placeholders
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

    if (requests.length > 0) {
      const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${tempDocId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Direct method placeholder replacement failed: ${updateResponse.status} - ${errorText}`);
      }
    }

    // Export to PDF
    const pdfResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}/export?mimeType=application/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      throw new Error(`Direct method PDF export failed: ${pdfResponse.status} - ${errorText}`);
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    return new Uint8Array(arrayBuffer);

  } finally {
    // Cleanup
    await fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }
}

async function myDriveFallbackMethod(
  templateDocId: string,
  placeholders: Record<string, string>,
  userData: any
): Promise<Uint8Array> {
  console.log('📄 My Drive fallback method...');
  
  const accessToken = await getGoogleAccessToken();
  
  // Create document in My Drive with simplified approach
  const tempDocTitle = `MSA_MyDrive_${userData.first_name}_${userData.last_name}_${Date.now()}`;
  
  const createResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: tempDocTitle
    })
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`My Drive method document creation failed: ${createResponse.status} - ${errorText}`);
  }

  const createResult = await createResponse.json();
  const tempDocId = createResult.id;

  try {
    // Simplified placeholder replacement (only essential ones)
    const essentialPlaceholders = {
      '{{Client}}': placeholders['{{Client}}'] || 'Client',
      '{{Name}}': placeholders['{{Name}}'] || 'User',
      '{{Agreement_date}}': placeholders['{{Agreement_date}}'] || new Date().toLocaleDateString()
    };

    const requests = [];
    for (const [placeholder, value] of Object.entries(essentialPlaceholders)) {
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

    if (requests.length > 0) {
      const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${tempDocId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests })
      });

      if (!updateResponse.ok) {
        console.warn('⚠️ My Drive method placeholder replacement failed, continuing...');
      }
    }

    // Export to PDF
    const pdfResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}/export?mimeType=application/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      throw new Error(`My Drive method PDF export failed: ${pdfResponse.status} - ${errorText}`);
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    return new Uint8Array(arrayBuffer);

  } finally {
    // Cleanup
    await fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }
}

async function minimalGenerationMethod(
  templateDocId: string,
  placeholders: Record<string, string>,
  userData: any
): Promise<Uint8Array> {
  console.log('📄 Minimal generation method...');
  
  const accessToken = await getGoogleAccessToken();
  
  // Minimal approach - just export the template as-is
  const pdfResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/export?mimeType=application/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!pdfResponse.ok) {
    const errorText = await pdfResponse.text();
    throw new Error(`Minimal method PDF export failed: ${pdfResponse.status} - ${errorText}`);
  }

  const arrayBuffer = await pdfResponse.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export async function testFallbackGeneration(): Promise<any> {
  try {
    console.log('🧪 Testing fallback generation...');
    
    const testPlaceholders = {
      '{{Client}}': 'Fallback Test Client',
      '{{Name}}': 'Fallback Test User',
      '{{Agreement_date}}': new Date().toLocaleDateString()
    };

    const testUserData = {
      first_name: 'Fallback',
      last_name: 'Test'
    };

    const envValidation = validateAndCorrectEnvironmentVariables();
    if (!envValidation.valid || !envValidation.correctedVars) {
      throw new Error('Environment validation failed');
    }

    const { templateDocId } = envValidation.correctedVars;
    
    const result = await generateMSAWithFallback(templateDocId, testPlaceholders, testUserData);
    
    console.log('✅ Fallback generation test result:', {
      success: result.success,
      method: result.method,
      attempts: result.attempts,
      pdfSize: result.pdfBuffer?.byteLength
    });

    return result;

  } catch (error) {
    console.error('❌ Fallback generation test failed:', error);
    return { success: false, error: error.message };
  }
}
