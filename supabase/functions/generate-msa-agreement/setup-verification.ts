
import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

export interface SetupVerificationResult {
  valid: boolean;
  issues: string[];
  details: {
    authentication: boolean;
    templateAccess: boolean;
    sharedDriveAccess: boolean;
    permissions: any;
  };
}

export async function verifyCompleteSetup(): Promise<SetupVerificationResult> {
  const result: SetupVerificationResult = {
    valid: true,
    issues: [],
    details: {
      authentication: false,
      templateAccess: false,
      sharedDriveAccess: false,
      permissions: null
    }
  };

  try {
    console.log('🔍 Starting complete setup verification...');
    
    // Environment validation
    const envValidation = validateAndCorrectEnvironmentVariables();
    if (!envValidation.valid) {
      result.valid = false;
      result.issues.push(...envValidation.issues);
      return result;
    }

    // Authentication test
    try {
      const accessToken = await getGoogleAccessToken();
      result.details.authentication = true;
      console.log('✅ Authentication successful');
    } catch (error) {
      result.valid = false;
      result.issues.push(`Authentication failed: ${error.message}`);
      console.error('❌ Authentication failed:', error);
    }

    // Template access test
    if (result.details.authentication) {
      try {
        const templateAccess = await verifyTemplateAccess();
        result.details.templateAccess = templateAccess;
        if (!templateAccess) {
          result.valid = false;
          result.issues.push('Template document access failed');
        }
      } catch (error) {
        result.valid = false;
        result.issues.push(`Template verification failed: ${error.message}`);
      }
    }

    // Shared Drive access test
    if (result.details.authentication) {
      try {
        const sharedDriveAccess = await verifySharedDriveAccess();
        result.details.sharedDriveAccess = sharedDriveAccess;
        if (!sharedDriveAccess) {
          result.valid = false;
          result.issues.push('Shared Drive access failed');
        }
      } catch (error) {
        result.valid = false;
        result.issues.push(`Shared Drive verification failed: ${error.message}`);
      }
    }

    // Debug permissions if authenticated
    if (result.details.authentication) {
      result.details.permissions = await debugSharedDrivePermissions();
    }

    console.log('🔍 Setup verification complete:', result);
    return result;

  } catch (error) {
    console.error('❌ Setup verification failed:', error);
    result.valid = false;
    result.issues.push(`Setup verification error: ${error.message}`);
    return result;
  }
}

async function verifyTemplateAccess(): Promise<boolean> {
  try {
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.correctedVars) {
      return false;
    }

    const { templateDocId } = envValidation.correctedVars;
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Template access verified:', data.name);
      return true;
    } else {
      console.error('❌ Template access failed:', response.status, await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Template access verification error:', error);
    return false;
  }
}

async function verifySharedDriveAccess(): Promise<boolean> {
  try {
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.correctedVars) {
      return false;
    }

    const { sharedDriveId } = envValidation.correctedVars;
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Shared Drive access verified:', data.name);
      return true;
    } else {
      console.error('❌ Shared Drive access failed:', response.status, await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Shared Drive access verification error:', error);
    return false;
  }
}

export async function debugSharedDrivePermissions(): Promise<any> {
  try {
    console.log('🔍 Starting comprehensive Shared Drive permissions debug...');
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.correctedVars) {
      console.error('❌ Environment validation failed');
      return null;
    }

    const { sharedDriveId, templateDocId } = envValidation.correctedVars;
    const permissionsData: any = {};

    // Check service account info
    try {
      const aboutResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (aboutResponse.ok) {
        const aboutData = await aboutResponse.json();
        permissionsData.serviceAccount = aboutData.user;
        console.log('📧 Service Account:', aboutData.user.emailAddress);
      }
    } catch (error) {
      console.error('❌ Failed to get service account info:', error);
    }

    // Check Shared Drive details
    try {
      const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (driveResponse.ok) {
        const driveData = await driveResponse.json();
        permissionsData.sharedDrive = driveData;
        console.log('📁 Shared Drive:', driveData.name);
        console.log('🔒 Capabilities:', driveData.capabilities);
      } else {
        console.error('❌ Failed to get Shared Drive details:', driveResponse.status);
        permissionsData.sharedDriveError = await driveResponse.text();
      }
    } catch (error) {
      console.error('❌ Shared Drive access error:', error);
      permissionsData.sharedDriveError = error.message;
    }

    // Check template document permissions
    try {
      const templateResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}?fields=*`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        permissionsData.templateDocument = templateData;
        console.log('📄 Template Document:', templateData.name);
        console.log('🔒 Template Capabilities:', templateData.capabilities);
      } else {
        console.error('❌ Failed to get template document:', templateResponse.status);
        permissionsData.templateError = await templateResponse.text();
      }
    } catch (error) {
      console.error('❌ Template document access error:', error);
      permissionsData.templateError = error.message;
    }

    // Check permissions on Shared Drive
    try {
      const permissionsResponse = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}/permissions`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (permissionsResponse.ok) {
        const permissionsResult = await permissionsResponse.json();
        permissionsData.sharedDrivePermissions = permissionsResult.permissions;
        console.log('👥 Shared Drive Permissions:', permissionsResult.permissions?.length || 0, 'entries');
        
        // Log each permission
        permissionsResult.permissions?.forEach((permission: any, index: number) => {
          console.log(`  ${index + 1}. ${permission.emailAddress || permission.displayName} (${permission.role})`);
        });
      } else {
        console.error('❌ Failed to get Shared Drive permissions:', permissionsResponse.status);
        permissionsData.permissionsError = await permissionsResponse.text();
      }
    } catch (error) {
      console.error('❌ Shared Drive permissions error:', error);
      permissionsData.permissionsError = error.message;
    }

    // Test file creation capability
    try {
      const testFileName = `MSA_Test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

      if (createResponse.ok) {
        const createResult = await createResponse.json();
        permissionsData.testFileCreation = {
          success: true,
          fileId: createResult.id,
          fileName: createResult.name
        };
        console.log('✅ Test file creation successful:', createResult.name);

        // Clean up test file
        const deleteResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${createResult.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (deleteResponse.ok) {
          console.log('🗑️ Test file cleaned up successfully');
        } else {
          console.warn('⚠️ Test file cleanup failed:', deleteResponse.status);
        }
      } else {
        console.error('❌ Test file creation failed:', createResponse.status);
        permissionsData.testFileCreation = {
          success: false,
          error: await createResponse.text()
        };
      }
    } catch (error) {
      console.error('❌ Test file creation error:', error);
      permissionsData.testFileCreation = {
        success: false,
        error: error.message
      };
    }

    // Check available drives
    try {
      const drivesResponse = await fetch('https://www.googleapis.com/drive/v3/drives', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (drivesResponse.ok) {
        const drivesData = await drivesResponse.json();
        permissionsData.availableDrives = drivesData.drives;
        console.log('💽 Available Drives:', drivesData.drives?.length || 0);
        
        drivesData.drives?.forEach((drive: any, index: number) => {
          console.log(`  ${index + 1}. ${drive.name} (${drive.id})`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to list drives:', error);
      permissionsData.drivesError = error.message;
    }

    console.log('🔍 Permissions debug complete');
    return permissionsData;

  } catch (error) {
    console.error('❌ Debug permissions failed:', error);
    return { error: error.message };
  }
}

export async function checkActualPermissions(): Promise<any> {
  try {
    console.log('🔍 Checking actual permissions...');
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.correctedVars) {
      return { error: 'Environment validation failed' };
    }

    const { sharedDriveId } = envValidation.correctedVars;
    
    // Test actual operations
    const operations = {
      listFiles: false,
      createFile: false,
      readFile: false,
      updateFile: false,
      deleteFile: false
    };

    // Test list files
    try {
      const listResponse = await fetch(`https://www.googleapis.com/drive/v3/files?driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&pageSize=10`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      operations.listFiles = listResponse.ok;
      console.log('📋 List files:', operations.listFiles ? '✅' : '❌');
    } catch (error) {
      console.error('❌ List files test failed:', error);
    }

    return operations;

  } catch (error) {
    console.error('❌ Actual permissions check failed:', error);
    return { error: error.message };
  }
}
