import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables, logEnvironmentIssues } from './environment-validation.ts';

export async function runComprehensiveSharedDriveDiagnostics() {
  console.log('🔍 Running comprehensive Employment Agreement Shared Drive diagnostics...');
  
  // Step 1: Validate and correct environment variables
  const envValidation = validateAndCorrectEnvironmentVariables();
  logEnvironmentIssues(envValidation);
  
  if (!envValidation.valid || !envValidation.correctedVars) {
    return {
      status: 'configuration_error',
      templateDoc: {
        accessible: false,
        error: 'Employment Agreement environment validation failed'
      },
      sharedDrive: {
        accessible: false,
        error: 'Environment validation failed'
      },
      serviceAccount: {
        authenticated: false
      },
      recommendations: [
        'Fix Employment Agreement environment variable configuration in Supabase secrets',
        'Set DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID for employment-specific template',
        ...envValidation.issues
      ]
    };
  }
  
  const { templateDocId, sharedDriveId, templateSource } = envValidation.correctedVars;
  
  try {
    // Step 2: Get access token
    console.log('🔄 Getting access token...');
    const accessToken = await getGoogleAccessToken();
    
    // Step 3: Get service account info
    console.log('🔍 Testing service account info...');
    const serviceAccountInfo = await getServiceAccountInfo();
    
    console.log('📄 Employment Agreement Template Document ID:', templateDocId, `(${templateSource})`);
    console.log('📁 Shared Drive ID:', sharedDriveId);
    console.log('✅ Service account email:', serviceAccountInfo.email);
    
    const result = {
      status: 'success',
      templateDoc: {
        accessible: false,
        templateSource
      },
      sharedDrive: {
        accessible: false
      },
      serviceAccount: {
        email: serviceAccountInfo.email,
        authenticated: true
      },
      recommendations: []
    };
    
    // Step 4: Test Employment Agreement template document access
    console.log('🔍 Testing Employment Agreement template document access...');
    try {
      const templateResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}?supportsAllDrives=true&fields=id,name,mimeType`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        result.templateDoc.accessible = true;
        result.templateDoc.name = templateData.name;
        console.log(`✅ Employment Agreement template document found: ${templateData.name}`);
        
        // Test if we can read the document content
        const contentResponse = await fetch(`https://docs.googleapis.com/v1/documents/${templateDocId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (contentResponse.ok) {
          console.log('✅ Can read Employment Agreement template document content');
        } else {
          console.warn('⚠️ Can access Employment Agreement template but cannot read content');
        }
      } else {
        const errorText = await templateResponse.text();
        result.templateDoc.error = `Cannot access Employment Agreement template document: ${templateResponse.status}`;
        console.error(`❌ Employment Agreement template document access failed: ${errorText}`);
        
        if (templateSource === 'employment-specific') {
          result.recommendations.push('❌ Employment Agreement template document access failed. Verify DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID and document permissions.');
        } else {
          result.recommendations.push('❌ Employment Agreement template document access failed. Consider setting DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID with employment-specific template, or verify DEFAULT_GOOGLE_DOC_ID and document permissions.');
        }
      }
    } catch (error) {
      result.templateDoc.error = error.message;
      console.error('❌ Employment Agreement template document test failed:', error);
      
      if (templateSource === 'employment-specific') {
        result.recommendations.push('❌ Employment Agreement template document access failed. Verify DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID and document permissions.');
      } else {
        result.recommendations.push('❌ Employment Agreement template document access failed. Consider setting DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID with employment-specific template, or verify DEFAULT_GOOGLE_DOC_ID and document permissions.');
      }
    }
    
    // Step 5: Test Shared Drive access
    console.log('🔍 Testing Shared Drive access...');
    try {
      const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}?fields=id,name,capabilities`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (driveResponse.ok) {
        const driveData = await driveResponse.json();
        result.sharedDrive.accessible = true;
        result.sharedDrive.name = driveData.name;
        console.log(`✅ Shared Drive found: ${driveData.name}`);
        
        // Test if we can list files in the drive
        const listResponse = await fetch(`https://www.googleapis.com/drive/v3/files?driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&pageSize=5`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (listResponse.ok) {
          const listData = await listResponse.json();
          console.log(`✅ Can list files in Shared Drive (${listData.files?.length || 0} files found)`);
          
          // Test Employment Agreement document creation in Shared Drive
          const createTestResponse = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: `employment-diagnostic-test-${Date.now()}`,
              mimeType: 'application/vnd.google-apps.document',
              parents: [sharedDriveId]
            })
          });
          
          if (createTestResponse.ok) {
            const testDoc = await createTestResponse.json();
            result.sharedDrive.canCreateDocuments = true;
            console.log('✅ Can create Employment Agreement documents in Shared Drive');
            
            // Clean up test document
            await fetch(`https://www.googleapis.com/drive/v3/files/${testDoc.id}?supportsAllDrives=true`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            console.log('✅ Test Employment Agreement document cleaned up');
          } else {
            const errorText = await createTestResponse.text();
            result.sharedDrive.canCreateDocuments = false;
            console.error(`❌ Cannot create Employment Agreement documents in Shared Drive: ${errorText}`);
            result.recommendations.push('❌ Shared Drive access failed for Employment Agreements. Verify GOOGLE_SHARED_DRIVE_ID and service account permissions.');
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
    
    // Step 6: Test Employment Agreement template copy to Shared Drive
    if (result.templateDoc.accessible && result.sharedDrive.accessible) {
      console.log('🔍 Testing Employment Agreement template copy to Shared Drive...');
      try {
        const copyResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy?supportsAllDrives=true`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: `employment-copy-test-${Date.now()}`,
            parents: [sharedDriveId]
          })
        });
        
        if (copyResponse.ok) {
          const copyDoc = await copyResponse.json();
          console.log('✅ Can copy Employment Agreement template document to Shared Drive');
          
          // Clean up test copy
          await fetch(`https://www.googleapis.com/drive/v3/files/${copyDoc.id}?supportsAllDrives=true`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          console.log('✅ Test Employment Agreement copy cleaned up');
        } else {
          const errorText = await copyResponse.text();
          console.error(`❌ Cannot copy Employment Agreement template document to Shared Drive: ${errorText}`);
          result.recommendations.push('❌ Can access Employment Agreement template document and Shared Drive separately but cannot copy template to Shared Drive. Check template permissions or Shared Drive access.');
        }
      } catch (error) {
        console.error('❌ Employment Agreement template copy test failed:', error);
        result.recommendations.push('❌ Can access Employment Agreement template document and Shared Drive separately but cannot copy template to Shared Drive. Check template permissions or Shared Drive access.');
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
    console.error('❌ Comprehensive Employment Agreement diagnostic failed:', error);
    return {
      status: 'configuration_error',
      templateDoc: {
        accessible: false,
        error: 'Employment Agreement diagnostic failed'
      },
      sharedDrive: {
        accessible: false,
        error: 'Diagnostic failed'
      },
      serviceAccount: {
        authenticated: false
      },
      recommendations: [
        '❌ Employment Agreement diagnostic process failed. Check Google service account configuration and permissions.',
        'Consider setting DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID for employment-specific template configuration.'
      ]
    };
  }
}

async function getServiceAccountInfo() {
  try {
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (serviceAccountKey) {
      const credentials = JSON.parse(serviceAccountKey);
      return {
        email: credentials.client_email
      };
    }
  } catch (error) {
    console.warn('Could not parse service account credentials');
  }
  return {};
}

export function logDiagnosticResults(result) {
  console.log('\n🔍 === COMPREHENSIVE EMPLOYMENT AGREEMENT DIAGNOSTIC RESULTS ===');
  console.log('\n🔧 Service Account:');
  console.log(`   ✅ Service account authenticated as: ${result.serviceAccount.email}`);
  
  console.log('\n📄 Employment Agreement Template Document Access:');
  if (result.templateDoc.accessible) {
    console.log(`   ✅ Employment Agreement template document accessible: "${result.templateDoc.name}"`);
    console.log(`   📋 Template source: ${result.templateDoc.templateSource || 'unknown'}`);
  } else {
    console.log(`   ❌ Employment Agreement template document issue: ${result.templateDoc.error}`);
    if (result.templateDoc.templateSource === 'generic-fallback') {
      console.log(`   💡 Currently using generic template fallback. Consider setting DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID for employment-specific template.`);
    }
  }
  
  console.log('\n📁 Shared Drive Access:');
  if (result.sharedDrive.accessible) {
    console.log(`   ✅ Shared Drive accessible: "${result.sharedDrive.name}"`);
    if (result.sharedDrive.canCreateDocuments) {
      console.log(`   ✅ Can create Employment Agreement documents in Shared Drive`);
    } else {
      console.log(`   ❌ Can access Shared Drive but cannot create Employment Agreement documents. Service account needs Editor permissions.`);
    }
  } else {
    console.log(`   ❌ Shared Drive issue: ${result.sharedDrive.error}`);
  }
  
  console.log(`\n📊 Overall Status: ${result.status.toUpperCase()}`);
  
  if (result.recommendations.length > 0) {
    console.log('\n💡 Employment Agreement Recommendations:');
    result.recommendations.forEach(rec => console.log(`   ${rec}`));
  }
  
  console.log('\n========================================================\n');
  
  if (result.status !== 'success') {
    console.error('🔍 Employment Agreement configuration issue detected. Please review diagnostic recommendations above.');
  }
}