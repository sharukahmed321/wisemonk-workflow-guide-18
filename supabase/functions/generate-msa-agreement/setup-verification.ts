import { getGoogleAccessToken } from './google-auth.ts';

export interface SetupCheckResult {
  valid: boolean;
  issues: string[];
  recommendations: string[];
}

export interface IDVerificationResult {
  templateDoc: {
    accessible: boolean;
    error?: string;
    name?: string;
  };
  sharedDrive: {
    accessible: boolean;
    error?: string;
    name?: string;
  };
}

export const quickSetupCheck = (): SetupCheckResult => {
  console.log('🔍 Running quick setup verification...');
  
  const result: SetupCheckResult = {
    valid: true,
    issues: [],
    recommendations: []
  };

  // Check required environment variables
  const templateDocId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID');
  const sharedDriveId = Deno.env.get('GOOGLE_SHARED_DRIVE_ID');
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');

  if (!templateDocId) {
    result.valid = false;
    result.issues.push('DEFAULT_GOOGLE_DOC_ID environment variable is missing');
    result.recommendations.push('Configure the Google Docs template ID in your Supabase secrets');
  }

  if (!sharedDriveId) {
    result.valid = false;
    result.issues.push('GOOGLE_SHARED_DRIVE_ID environment variable is missing');
    result.recommendations.push('Configure the Google Shared Drive ID in your Supabase secrets');
  }

  if (!serviceAccountKey) {
    result.valid = false;
    result.issues.push('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is missing');
    result.recommendations.push('Configure the Google Service Account credentials in your Supabase secrets');
  }

  // Validate ID formats (Google IDs are typically 15+ characters with alphanumeric, underscore, hyphen)
  if (templateDocId) {
    if (templateDocId.length < 15 || !/^[a-zA-Z0-9_-]+$/.test(templateDocId)) {
      result.valid = false;
      result.issues.push('DEFAULT_GOOGLE_DOC_ID appears to have invalid format');
      result.recommendations.push('Verify the Google Docs template ID is correct (should be 15+ alphanumeric characters, e.g., "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms")');
    }
  }

  if (sharedDriveId) {
    if (sharedDriveId.length < 15 || !/^[a-zA-Z0-9_-]+$/.test(sharedDriveId)) {
      result.valid = false;
      result.issues.push('GOOGLE_SHARED_DRIVE_ID appears to have invalid format');
      result.recommendations.push('Verify the Google Shared Drive ID is correct (should be 15+ alphanumeric characters, e.g., "0APJvA5EhOt9EUk9PVA")');
    }
  }

  // Check that template and shared drive IDs are different
  if (templateDocId && sharedDriveId && templateDocId === sharedDriveId) {
    result.valid = false;
    result.issues.push('Template document ID and Shared Drive ID cannot be the same');
    result.recommendations.push('Use different IDs for the template document and Shared Drive');
  }

  // Log results
  if (result.valid) {
    console.log('✅ Quick setup check passed');
  } else {
    console.log('❌ Quick setup check failed:', result.issues.length, 'issues found');
    result.issues.forEach(issue => console.log(`   ❌ ${issue}`));
  }

  return result;
};

export const verifyBothIDs = async (accessToken: string): Promise<IDVerificationResult> => {
  console.log('🔍 Verifying template document and Shared Drive access...');
  
  const templateDocId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID');
  const sharedDriveId = Deno.env.get('GOOGLE_SHARED_DRIVE_ID');

  const result: IDVerificationResult = {
    templateDoc: { accessible: false },
    sharedDrive: { accessible: false }
  };

  // Verify template document
  if (templateDocId) {
    try {
      console.log(`🔍 Testing template document access: ${templateDocId}`);
      
      const templateResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}?supportsAllDrives=true&fields=id,name,mimeType`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        
        // Verify it's actually a Google Docs document
        if (templateData.mimeType === 'application/vnd.google-apps.document') {
          result.templateDoc.accessible = true;
          result.templateDoc.name = templateData.name;
          console.log(`✅ Template document accessible: "${templateData.name}"`);
        } else {
          result.templateDoc.error = `Template is not a Google Docs document (type: ${templateData.mimeType})`;
          console.log(`❌ ${result.templateDoc.error}`);
        }
      } else {
        const errorText = await templateResponse.text();
        if (templateResponse.status === 404) {
          result.templateDoc.error = 'Template document not found - verify the ID is correct';
        } else if (templateResponse.status === 403) {
          result.templateDoc.error = 'Access denied to template document - check service account permissions';
        } else {
          result.templateDoc.error = `Template document access failed: ${templateResponse.status}`;
        }
        console.log(`❌ ${result.templateDoc.error}`);
      }
    } catch (error) {
      result.templateDoc.error = `Template document verification failed: ${error.message}`;
      console.log(`❌ ${result.templateDoc.error}`);
    }
  }

  // Verify Shared Drive
  if (sharedDriveId) {
    try {
      console.log(`🔍 Testing Shared Drive access: ${sharedDriveId}`);
      
      const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}?fields=id,name,capabilities`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (driveResponse.ok) {
        const driveData = await driveResponse.json();
        
        // Check if we can create files in this drive
        if (driveData.capabilities?.canAddChildren !== false) {
          result.sharedDrive.accessible = true;
          result.sharedDrive.name = driveData.name;
          console.log(`✅ Shared Drive accessible: "${driveData.name}"`);
          
          // Test file creation capability with a minimal test
          try {
            const testResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: `verification-test-${Date.now()}`,
                parents: [sharedDriveId],
                mimeType: 'application/vnd.google-apps.document',
                supportsAllDrives: true
              })
            });
            
            if (testResponse.ok) {
              const testDoc = await testResponse.json();
              console.log('✅ Can create documents in Shared Drive');
              
              // Clean up test document
              await fetch(`https://www.googleapis.com/drive/v3/files/${testDoc.id}?supportsAllDrives=true`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
              });
            } else {
              result.sharedDrive.accessible = false;
              result.sharedDrive.error = 'Cannot create documents in Shared Drive - check permissions';
              console.log(`❌ ${result.sharedDrive.error}`);
            }
          } catch (testError) {
            console.warn('⚠️ Could not test document creation, but drive is accessible');
          }
        } else {
          result.sharedDrive.error = 'Shared Drive does not allow file creation';
          console.log(`❌ ${result.sharedDrive.error}`);
        }
      } else {
        const errorText = await driveResponse.text();
        if (driveResponse.status === 404) {
          result.sharedDrive.error = 'Shared Drive not found - verify the ID is correct';
        } else if (driveResponse.status === 403) {
          result.sharedDrive.error = 'Access denied to Shared Drive - check service account permissions';
        } else {
          result.sharedDrive.error = `Shared Drive access failed: ${driveResponse.status}`;
        }
        console.log(`❌ ${result.sharedDrive.error}`);
      }
    } catch (error) {
      result.sharedDrive.error = `Shared Drive verification failed: ${error.message}`;
      console.log(`❌ ${result.sharedDrive.error}`);
    }
  }

  return result;
};
