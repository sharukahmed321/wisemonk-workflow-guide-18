
import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

export interface EnhancedGenerationOptions {
  useRetry: boolean;
  retryAttempts: number;
  validateSteps: boolean;
  cleanupOnError: boolean;
  verboseLogging: boolean;
}

export async function generateMSAWithEnhancedErrorHandling(
  templateDocId: string,
  placeholders: Record<string, string>,
  userData: any,
  options: EnhancedGenerationOptions = {
    useRetry: true,
    retryAttempts: 3,
    validateSteps: true,
    cleanupOnError: true,
    verboseLogging: true
  }
): Promise<Uint8Array> {
  let tempDocId: string | null = null;
  let attempt = 0;

  while (attempt < options.retryAttempts) {
    try {
      attempt++;
      if (options.verboseLogging) {
        console.log(`🔄 Enhanced generation attempt ${attempt}/${options.retryAttempts}`);
      }

      // Environment validation
      const envValidation = validateAndCorrectEnvironmentVariables();
      if (!envValidation.valid || !envValidation.correctedVars) {
        throw new Error(`Environment validation failed: ${envValidation.issues.join('; ')}`);
      }

      const { sharedDriveId } = envValidation.correctedVars;
      const accessToken = await getGoogleAccessToken();

      // Step 1: Create document with enhanced error handling
      tempDocId = await createDocumentWithRetry(accessToken, templateDocId, sharedDriveId, userData, options);
      
      if (options.validateSteps) {
        await validateDocumentCreation(accessToken, tempDocId, options);
      }

      // Step 2: Replace placeholders with validation
      await replaceDocumentPlaceholdersWithValidation(accessToken, tempDocId, placeholders, options);
      
      if (options.validateSteps) {
        await validatePlaceholderReplacement(accessToken, tempDocId, placeholders, options);
      }

      // Step 3: Export to PDF with retry
      const pdfBuffer = await exportDocumentToPDFWithRetry(accessToken, tempDocId, options);
      
      if (options.verboseLogging) {
        console.log('✅ Enhanced generation completed successfully');
      }

      return pdfBuffer;

    } catch (error) {
      if (options.verboseLogging) {
        console.error(`❌ Enhanced generation attempt ${attempt} failed:`, error.message);
      }

      if (options.cleanupOnError && tempDocId) {
        await safeCleanupDocument(tempDocId, options);
        tempDocId = null;
      }

      if (attempt >= options.retryAttempts) {
        throw error;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error('Enhanced generation failed after all retry attempts');
}

async function createDocumentWithRetry(
  accessToken: string,
  templateDocId: string,
  sharedDriveId: string,
  userData: any,
  options: EnhancedGenerationOptions
): Promise<string> {
  const tempDocTitle = `MSA_Enhanced_${userData.first_name}_${userData.last_name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let retryCount = 0;
  while (retryCount < 3) {
    try {
      if (options.verboseLogging) {
        console.log(`📄 Creating document (attempt ${retryCount + 1}): ${tempDocTitle}`);
      }

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
        throw new Error(`Document creation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (options.verboseLogging) {
        console.log('✅ Document created successfully:', result.id);
      }
      return result.id;

    } catch (error) {
      retryCount++;
      if (options.verboseLogging) {
        console.error(`❌ Document creation attempt ${retryCount} failed:`, error.message);
      }
      
      if (retryCount >= 3) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }

  throw new Error('Document creation failed after all retries');
}

async function validateDocumentCreation(
  accessToken: string,
  documentId: string,
  options: EnhancedGenerationOptions
): Promise<void> {
  try {
    if (options.verboseLogging) {
      console.log('🔍 Validating document creation...');
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Document validation failed: ${response.status}`);
    }

    const data = await response.json();
    if (options.verboseLogging) {
      console.log('✅ Document validation passed:', data.name);
    }
  } catch (error) {
    if (options.verboseLogging) {
      console.error('❌ Document validation failed:', error.message);
    }
    throw error;
  }
}

async function replaceDocumentPlaceholdersWithValidation(
  accessToken: string,
  documentId: string,
  placeholders: Record<string, string>,
  options: EnhancedGenerationOptions
): Promise<void> {
  try {
    if (options.verboseLogging) {
      console.log('🔄 Replacing placeholders with validation...');
    }

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
      if (options.verboseLogging) {
        console.log('⚠️ No placeholders to replace');
      }
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
      throw new Error(`Placeholder replacement failed: ${response.status} - ${errorText}`);
    }

    if (options.verboseLogging) {
      console.log('✅ Placeholders replaced successfully');
    }
  } catch (error) {
    if (options.verboseLogging) {
      console.error('❌ Placeholder replacement failed:', error.message);
    }
    throw error;
  }
}

async function validatePlaceholderReplacement(
  accessToken: string,
  documentId: string,
  placeholders: Record<string, string>,
  options: EnhancedGenerationOptions
): Promise<void> {
  try {
    if (options.verboseLogging) {
      console.log('🔍 Validating placeholder replacement...');
    }

    // Get document content to verify placeholders were replaced
    const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Placeholder validation failed: ${response.status}`);
    }

    const document = await response.json();
    const content = JSON.stringify(document.body);
    
    // Check if any placeholders remain
    const remainingPlaceholders = Object.keys(placeholders).filter(placeholder => 
      content.includes(placeholder)
    );

    if (remainingPlaceholders.length > 0) {
      if (options.verboseLogging) {
        console.warn('⚠️ Some placeholders were not replaced:', remainingPlaceholders);
      }
    } else {
      if (options.verboseLogging) {
        console.log('✅ All placeholders validated successfully');
      }
    }
  } catch (error) {
    if (options.verboseLogging) {
      console.error('❌ Placeholder validation failed:', error.message);
    }
    // Don't throw here - validation failure shouldn't stop the process
  }
}

async function exportDocumentToPDFWithRetry(
  accessToken: string,
  documentId: string,
  options: EnhancedGenerationOptions
): Promise<Uint8Array> {
  let retryCount = 0;
  
  while (retryCount < 3) {
    try {
      if (options.verboseLogging) {
        console.log(`📄 Exporting PDF (attempt ${retryCount + 1})...`);
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDF export failed: ${response.status} - ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const pdfBuffer = new Uint8Array(arrayBuffer);
      
      if (options.verboseLogging) {
        console.log('✅ PDF export successful, size:', pdfBuffer.byteLength);
      }
      
      return pdfBuffer;

    } catch (error) {
      retryCount++;
      if (options.verboseLogging) {
        console.error(`❌ PDF export attempt ${retryCount} failed:`, error.message);
      }
      
      if (retryCount >= 3) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }

  throw new Error('PDF export failed after all retries');
}

async function safeCleanupDocument(documentId: string, options: EnhancedGenerationOptions): Promise<void> {
  try {
    if (options.verboseLogging) {
      console.log('🗑️ Cleaning up document:', documentId);
    }

    const accessToken = await getGoogleAccessToken();
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.ok) {
      if (options.verboseLogging) {
        console.log('✅ Document cleanup successful');
      }
    } else {
      if (options.verboseLogging) {
        console.warn('⚠️ Document cleanup failed:', response.status);
      }
    }
  } catch (error) {
    if (options.verboseLogging) {
      console.error('❌ Document cleanup error:', error.message);
    }
  }
}

export async function testEnhancedGeneration(): Promise<any> {
  try {
    console.log('🧪 Testing enhanced generation...');
    
    const testPlaceholders = {
      '{{Client}}': 'Test Client',
      '{{Name}}': 'Test User',
      '{{Agreement_date}}': new Date().toLocaleDateString()
    };

    const testUserData = {
      first_name: 'Test',
      last_name: 'User'
    };

    const envValidation = validateAndCorrectEnvironmentVariables();
    if (!envValidation.valid || !envValidation.correctedVars) {
      throw new Error('Environment validation failed');
    }

    const { templateDocId } = envValidation.correctedVars;
    
    const result = await generateMSAWithEnhancedErrorHandling(
      templateDocId,
      testPlaceholders,
      testUserData,
      {
        useRetry: true,
        retryAttempts: 2,
        validateSteps: true,
        cleanupOnError: true,
        verboseLogging: true
      }
    );

    console.log('✅ Enhanced generation test successful, PDF size:', result.byteLength);
    return { success: true, size: result.byteLength };

  } catch (error) {
    console.error('❌ Enhanced generation test failed:', error);
    return { success: false, error: error.message };
  }
}
