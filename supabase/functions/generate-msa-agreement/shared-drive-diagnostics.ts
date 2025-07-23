
import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

export interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export async function runComprehensiveSharedDriveDiagnostics(): Promise<DiagnosticResult> {
  console.log('🔍 Starting comprehensive Shared Drive diagnostics...');
  
  try {
    const diagnostics = {
      environment: await diagnoseEnvironment(),
      authentication: await diagnoseAuthentication(),
      driveAccess: await diagnoseDriveAccess(),
      templateAccess: await diagnoseTemplateAccess(),
      permissions: await diagnosePermissions(),
      fileOperations: await diagnoseFileOperations(),
      workflow: await diagnoseCompleteWorkflow()
    };

    const allSuccessful = Object.values(diagnostics).every(d => d.success);
    
    const result: DiagnosticResult = {
      success: allSuccessful,
      message: allSuccessful ? 'All diagnostics passed' : 'Some diagnostics failed',
      details: diagnostics
    };

    console.log('🔍 Comprehensive diagnostics complete:', result);
    return result;

  } catch (error) {
    console.error('❌ Comprehensive diagnostics failed:', error);
    return {
      success: false,
      message: 'Diagnostics failed',
      error: error.message
    };
  }
}

async function diagnoseEnvironment(): Promise<DiagnosticResult> {
  try {
    console.log('🔍 Diagnosing environment variables...');
    
    const validation = validateAndCorrectEnvironmentVariables();
    
    if (!validation.valid) {
      return {
        success: false,
        message: 'Environment validation failed',
        details: validation.issues
      };
    }

    console.log('✅ Environment variables validated');
    return {
      success: true,
      message: 'Environment variables valid',
      details: validation.correctedVars
    };

  } catch (error) {
    console.error('❌ Environment diagnosis failed:', error);
    return {
      success: false,
      message: 'Environment diagnosis failed',
      error: error.message
    };
  }
}

async function diagnoseAuthentication(): Promise<DiagnosticResult> {
  try {
    console.log('🔍 Diagnosing authentication...');
    
    const accessToken = await getGoogleAccessToken();
    
    // Test token validity
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentication successful for:', data.user.emailAddress);
      return {
        success: true,
        message: 'Authentication successful',
        details: data.user
      };
    } else {
      const errorText = await response.text();
      console.error('❌ Authentication failed:', response.status, errorText);
      return {
        success: false,
        message: 'Authentication failed',
        error: errorText
      };
    }

  } catch (error) {
    console.error('❌ Authentication diagnosis failed:', error);
    return {
      success: false,
      message: 'Authentication diagnosis failed',
      error: error.message
    };
  }
}

async function diagnoseDriveAccess(): Promise<DiagnosticResult> {
  try {
    console.log('🔍 Diagnosing Shared Drive access...');
    
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.correctedVars) {
      return {
        success: false,
        message: 'Environment validation failed'
      };
    }

    const { sharedDriveId } = envValidation.correctedVars;
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Shared Drive access successful:', data.name);
      return {
        success: true,
        message: 'Shared Drive access successful',
        details: data
      };
    } else {
      const errorText = await response.text();
      console.error('❌ Shared Drive access failed:', response.status, errorText);
      return {
        success: false,
        message: 'Shared Drive access failed',
        error: errorText
      };
    }

  } catch (error) {
    console.error('❌ Drive access diagnosis failed:', error);
    return {
      success: false,
      message: 'Drive access diagnosis failed',
      error: error.message
    };
  }
}

async function diagnoseTemplateAccess(): Promise<DiagnosticResult> {
  try {
    console.log('🔍 Diagnosing template document access...');
    
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.correctedVars) {
      return {
        success: false,
        message: 'Environment validation failed'
      };
    }

    const { templateDocId } = envValidation.correctedVars;
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}?fields=*`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Template document access successful:', data.name);
      return {
        success: true,
        message: 'Template document access successful',
        details: data
      };
    } else {
      const errorText = await response.text();
      console.error('❌ Template document access failed:', response.status, errorText);
      return {
        success: false,
        message: 'Template document access failed',
        error: errorText
      };
    }

  } catch (error) {
    console.error('❌ Template access diagnosis failed:', error);
    return {
      success: false,
      message: 'Template access diagnosis failed',
      error: error.message
    };
  }
}

async function diagnosePermissions(): Promise<DiagnosticResult> {
  try {
    console.log('🔍 Diagnosing permissions...');
    
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.correctedVars) {
      return {
        success: false,
        message: 'Environment validation failed'
      };
    }

    const { sharedDriveId } = envValidation.correctedVars;
    
    // Check drive permissions
    const permissionsResponse = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}/permissions`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (permissionsResponse.ok) {
      const permissionsData = await permissionsResponse.json();
      console.log('✅ Permissions check successful:', permissionsData.permissions?.length || 0, 'entries');
      return {
        success: true,
        message: 'Permissions check successful',
        details: permissionsData.permissions
      };
    } else {
      const errorText = await permissionsResponse.text();
      console.error('❌ Permissions check failed:', permissionsResponse.status, errorText);
      return {
        success: false,
        message: 'Permissions check failed',
        error: errorText
      };
    }

  } catch (error) {
    console.error('❌ Permissions diagnosis failed:', error);
    return {
      success: false,
      message: 'Permissions diagnosis failed',
      error: error.message
    };
  }
}

async function diagnoseFileOperations(): Promise<DiagnosticResult> {
  try {
    console.log('🔍 Diagnosing file operations...');
    
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.correctedVars) {
      return {
        success: false,
        message: 'Environment validation failed'
      };
    }

    const { sharedDriveId, templateDocId } = envValidation.correctedVars;
    
    // Test file creation
    const testFileName = `MSA_Diagnostic_Test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const createResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: testFileName,
        parents: [sharedDriveId]
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ File creation failed:', createResponse.status, errorText);
      return {
        success: false,
        message: 'File creation failed',
        error: errorText
      };
    }

    const createResult = await createResponse.json();
    console.log('✅ Test file created:', createResult.name);

    // Test file deletion (cleanup)
    const deleteResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${createResult.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (deleteResponse.ok) {
      console.log('✅ Test file deleted successfully');
      return {
        success: true,
        message: 'File operations successful',
        details: { created: createResult.name, deleted: true }
      };
    } else {
      console.warn('⚠️ Test file cleanup failed:', deleteResponse.status);
      return {
        success: true,
        message: 'File operations mostly successful (cleanup failed)',
        details: { created: createResult.name, deleted: false }
      };
    }

  } catch (error) {
    console.error('❌ File operations diagnosis failed:', error);
    return {
      success: false,
      message: 'File operations diagnosis failed',
      error: error.message
    };
  }
}

async function diagnoseCompleteWorkflow(): Promise<DiagnosticResult> {
  try {
    console.log('🔍 Diagnosing complete workflow...');
    
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.correctedVars) {
      return {
        success: false,
        message: 'Environment validation failed'
      };
    }

    const { sharedDriveId, templateDocId } = envValidation.correctedVars;
    
    // Simulate complete workflow
    const workflowSteps = {
      documentCopy: false,
      placeholderReplacement: false,
      pdfExport: false,
      cleanup: false
    };

    // Step 1: Create document copy
    const testFileName = `MSA_Workflow_Test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const copyResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: testFileName,
        parents: [sharedDriveId]
      })
    });

    if (copyResponse.ok) {
      const copyResult = await copyResponse.json();
      workflowSteps.documentCopy = true;
      console.log('✅ Workflow Step 1: Document copy successful');

      // Step 2: Test placeholder replacement
      const placeholderRequests = [{
        replaceAllText: {
          containsText: {
            text: '{{Client}}',
            matchCase: true
          },
          replaceText: 'Test Client'
        }
      }];

      const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${copyResult.id}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: placeholderRequests })
      });

      if (updateResponse.ok) {
        workflowSteps.placeholderReplacement = true;
        console.log('✅ Workflow Step 2: Placeholder replacement successful');
      } else {
        console.error('❌ Workflow Step 2: Placeholder replacement failed:', updateResponse.status);
      }

      // Step 3: Test PDF export
      const pdfResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${copyResult.id}/export?mimeType=application/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (pdfResponse.ok) {
        workflowSteps.pdfExport = true;
        console.log('✅ Workflow Step 3: PDF export successful');
      } else {
        console.error('❌ Workflow Step 3: PDF export failed:', pdfResponse.status);
      }

      // Step 4: Cleanup
      const deleteResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${copyResult.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (deleteResponse.ok) {
        workflowSteps.cleanup = true;
        console.log('✅ Workflow Step 4: Cleanup successful');
      } else {
        console.warn('⚠️ Workflow Step 4: Cleanup failed');
      }

    } else {
      console.error('❌ Workflow Step 1: Document copy failed:', copyResponse.status);
    }

    const allStepsSuccessful = Object.values(workflowSteps).every(step => step);
    
    return {
      success: allStepsSuccessful,
      message: allStepsSuccessful ? 'Complete workflow successful' : 'Workflow partially failed',
      details: workflowSteps
    };

  } catch (error) {
    console.error('❌ Workflow diagnosis failed:', error);
    return {
      success: false,
      message: 'Workflow diagnosis failed',
      error: error.message
    };
  }
}

export async function runQuickDiagnostics(): Promise<DiagnosticResult> {
  try {
    console.log('🔍 Running quick diagnostics...');
    
    const results = {
      environment: await diagnoseEnvironment(),
      authentication: await diagnoseAuthentication(),
      driveAccess: await diagnoseDriveAccess()
    };

    const allSuccessful = Object.values(results).every(r => r.success);
    
    return {
      success: allSuccessful,
      message: allSuccessful ? 'Quick diagnostics passed' : 'Quick diagnostics failed',
      details: results
    };

  } catch (error) {
    console.error('❌ Quick diagnostics failed:', error);
    return {
      success: false,
      message: 'Quick diagnostics failed',
      error: error.message
    };
  }
}
