
import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables, logEnvironmentIssues } from './environment-validation.ts';

export interface SharedDriveDiagnosticResult {
  status: 'success' | 'access_error' | 'configuration_error';
  templateDoc: {
    accessible: boolean;
    name?: string;
    error?: string;
  };
  sharedDrive: {
    accessible: boolean;
    name?: string;
    canCreateDocuments?: boolean;
    error?: string;
  };
  serviceAccount: {
    email?: string;
    authenticated: boolean;
  };
  recommendations: string[];
}

export async function runComprehensiveSharedDriveDiagnostics(): Promise<SharedDriveDiagnosticResult> {
  console.log('🔍 Running comprehensive Shared Drive diagnostics...');
  
  // Step 1: Validate and correct environment variables
  const envValidation = validateAndCorrectEnvironmentVariables();
  logEnvironmentIssues(envValidation);
  
  if (!envValidation.valid || !envValidation.correctedVars) {
    return {
      status: 'configuration_error',
      templateDoc: { accessible: false, error: 'Environment validation failed' },
      sharedDrive: { accessible: false, error: 'Environment validation failed' },
      serviceAccount: { authenticated: false },
      recommendations: [
        'Fix environment variable configuration in Supabase secrets',
        ...envValidation.issues
      ]
    };
  }
  
  const { templateDocId, sharedDriveId } = envValidation.correctedVars;
  
  try {
    // Step 2: Get access token
    console.log('🔄 Getting access token...');
    const accessToken = await getGoogleAccessToken();
    
    // Step 3: Get service account info
    console.log('🔍 Testing service account info...');
    const serviceAccountInfo = await getServiceAccountInfo();
    
    console.log('📄 Template Document ID:', templateDocId);
    console.log('📁 Shared Drive ID:', sharedDriveId);
    console.log('✅ Service account email:', serviceAccountInfo.email);
    
    const result: SharedDriveDiagnosticResult = {
      status: 'success',
      templateDoc: { accessible: false },
      sharedDrive: { accessible: false },
      serviceAccount: { 
        email: serviceAccountInfo.email,
        authenticated: true 
      },
      recommendations: []
    };
    
    // Step 4: Test template document access
    console.log('🔍 Testing template document access...');
    try {
      const templateResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}?supportsAllDrives=true&fields=id,name,mimeType`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        result.templateDoc.accessible = true;
        result.templateDoc.name = templateData.name;
        console.log(`✅ Template document found: ${templateData.name}`);
        
        // Test if we can read the document content
        const contentResponse = await fetch(`https://docs.googleapis.com/v1/documents/${templateDocId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (contentResponse.ok) {
          console.log('✅ Can read template document content');
        } else {
          console.warn('⚠️ Can access template but cannot read content');
        }
      } else {
        const errorText = await templateResponse.text();
        result.templateDoc.error = `Cannot access template document: ${templateResponse.status}`;
        console.error(`❌ Template document access failed: ${errorText}`);
        result.recommendations.push('❌ Template document access failed. Verify DEFAULT_GOOGLE_DOC_ID and document permissions.');
      }
    } catch (error) {
      result.templateDoc.error = error.message;
      console.error('❌ Template document test failed:', error);
      result.recommendations.push('❌ Template document access failed. Verify DEFAULT_GOOGLE_DOC_ID and document permissions.');
    }
    
    // Step 5: Test Shared Drive access
    console.log('🔍 Testing Shared Drive access...');
    try {
      const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}?fields=id,name,capabilities`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (driveResponse.ok) {
        const driveData = await driveResponse.json();
        result.sharedDrive.accessible = true;
        result.sharedDrive.name = driveData.name;
        console.log(`✅ Shared Drive found: ${driveData.name}`);
        
        // Test if we can list files in the drive
        const listResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&pageSize=5`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        if (listResponse.ok) {
          const listData = await listResponse.json();
          console.log(`✅ Can list files in Shared Drive (${listData.files?.length || 0} files found)`);
          
          // FIXED: Test document creation in Shared Drive (using correct Shared Drive ID)
          const createTestResponse = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: `diagnostic-test-${Date.now()}`,
              mimeType: 'application/vnd.google-apps.document',
              parents: [sharedDriveId] // FIXED: Use sharedDriveId, not templateDocId
            })
          });
          
          if (createTestResponse.ok) {
            const testDoc = await createTestResponse.json();
            result.sharedDrive.canCreateDocuments = true;
            console.log('✅ Can create documents in Shared Drive');
            
            // Clean up test document
            await fetch(`https://www.googleapis.com/drive/v3/files/${testDoc.id}?supportsAllDrives=true`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            console.log('✅ Test document cleaned up');
          } else {
            const errorText = await createTestResponse.text();
            result.sharedDrive.canCreateDocuments = false;
            console.error(`❌ Cannot create documents in Shared Drive: ${errorText}`);
            result.recommendations.push('❌ Shared Drive access failed. Verify GOOGLE_SHARED_DRIVE_ID and service account permissions.');
          }
        }
      } else {
        const errorText = await driveResponse.text();
        result.sharedDrive.error = `Cannot access Shared Drive: ${driveResponse.status}`;
        console.error(`❌ Shared Drive access failed: ${errorText}`);
        result.recommendations.push('❌ Shared Drive access failed. Verify GOOGLE_SHARED_DRIVE_ID and service account permissions.');
      }
    } catch (error) {
      result.sharedDrive.error = error.message;
      console.error('❌ Shared Drive test failed:', error);
      result.recommendations.push('❌ Shared Drive access failed. Verify GOOGLE_SHARED_DRIVE_ID and service account permissions.');
    }
    
    // Step 6: Test template copy to Shared Drive
    if (result.templateDoc.accessible && result.sharedDrive.accessible) {
      console.log('🔍 Testing template copy to Shared Drive...');
      try {
        // FIXED: Use correct templateDocId for copy source, sharedDriveId for destination
        const copyResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy?supportsAllDrives=true`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: `copy-test-${Date.now()}`,
            parents: [sharedDriveId] // FIXED: Use sharedDriveId as destination
          })
        });
        
        if (copyResponse.ok) {
          const copyDoc = await copyResponse.json();
          console.log('✅ Can copy template document to Shared Drive');
          
          // Clean up test copy
          await fetch(`https://www.googleapis.com/drive/v3/files/${copyDoc.id}?supportsAllDrives=true`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          console.log('✅ Test copy cleaned up');
        } else {
          const errorText = await copyResponse.text();
          console.error(`❌ Cannot copy template document to Shared Drive: ${errorText}`);
          result.recommendations.push('❌ Can access template document and Shared Drive separately but cannot copy template to Shared Drive. Check template permissions or Shared Drive access.');
        }
      } catch (error) {
        console.error('❌ Template copy test failed:', error);
        result.recommendations.push('❌ Can access template document and Shared Drive separately but cannot copy template to Shared Drive. Check template permissions or Shared Drive access.');
      }
    }
    
    // Determine overall status
    if (result.templateDoc.accessible && result.sharedDrive.accessible && result.sharedDrive.canCreateDocuments) {
      result.status = 'success';
    } else {
      result.status = 'access_error';
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Comprehensive diagnostic failed:', error);
    return {
      status: 'configuration_error',
      templateDoc: { accessible: false, error: 'Diagnostic failed' },
      sharedDrive: { accessible: false, error: 'Diagnostic failed' },
      serviceAccount: { authenticated: false },
      recommendations: [
        '❌ Diagnostic process failed. Check Google service account configuration and permissions.'
      ]
    };
  }
}

async function getServiceAccountInfo(): Promise<{ email?: string }> {
  try {
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (serviceAccountKey) {
      const credentials = JSON.parse(serviceAccountKey);
      return { email: credentials.client_email };
    }
  } catch (error) {
    console.warn('Could not parse service account credentials');
  }
  return {};
}

export function logDiagnosticResults(result: SharedDriveDiagnosticResult): void {
  console.log('\n🔍 === COMPREHENSIVE DIAGNOSTIC RESULTS ===');
  
  console.log('\n🔧 Service Account:');
  console.log(`   ✅ Service account authenticated as: ${result.serviceAccount.email}`);
  
  console.log('\n📄 Template Document Access:');
  if (result.templateDoc.accessible) {
    console.log(`   ✅ Template document accessible: "${result.templateDoc.name}"`);
  } else {
    console.log(`   ❌ Template document issue: ${result.templateDoc.error}`);
  }
  
  console.log('\n📁 Shared Drive Access:');
  if (result.sharedDrive.accessible) {
    console.log(`   ✅ Shared Drive accessible: "${result.sharedDrive.name}"`);
    if (result.sharedDrive.canCreateDocuments) {
      console.log(`   ✅ Can create documents in Shared Drive`);
    } else {
      console.log(`   ❌ Can access Shared Drive but cannot create documents. Service account needs Editor permissions.`);
    }
  } else {
    console.log(`   ❌ Shared Drive issue: ${result.sharedDrive.error}`);
  }
  
  console.log(`\n📊 Overall Status: ${result.status.toUpperCase()}`);
  
  if (result.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    result.recommendations.forEach(rec => console.log(`   ${rec}`));
  }
  
  console.log('\n===========================================\n');
  
  if (result.status !== 'success') {
    console.error('🔍 Configuration issue detected. Please review diagnostic recommendations above.');
  }
}
