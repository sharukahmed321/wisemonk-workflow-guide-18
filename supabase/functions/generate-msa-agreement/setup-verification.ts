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
    workingMethod?: string;
    capabilities?: any;
  };
}

// CRITICAL: Environment variable validation and correction
function validateAndGetEnvironmentVariables() {
  console.log('🔍 === ENVIRONMENT VARIABLE VALIDATION ===');
  
  const rawTemplateDocId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID');
  const rawSharedDriveId = Deno.env.get('GOOGLE_SHARED_DRIVE_ID');
  
  console.log(`📄 Raw DEFAULT_GOOGLE_DOC_ID: "${rawTemplateDocId}"`);
  console.log(`📁 Raw GOOGLE_SHARED_DRIVE_ID: "${rawSharedDriveId}"`);
  
  // CRITICAL FIX: Force the correct template document ID
  // Based on previous logs, the correct template ID is: 1GyU3aCxwQIm69Y3ql_rcTU0jp2HKZNQeIlvFNVBc94o
  const CORRECT_TEMPLATE_DOC_ID = '1GyU3aCxwQIm69Y3ql_rcTU0jp2HKZNQeIlvFNVBc94o';
  const CORRECT_SHARED_DRIVE_ID = '0AJLtAJTQC6NLUk9PVA';
  
  // Validate and correct if necessary
  let templateDocId = rawTemplateDocId;
  let sharedDriveId = rawSharedDriveId;
  
  // CRITICAL: Check if template ID is incorrectly set to shared drive ID
  if (rawTemplateDocId === CORRECT_SHARED_DRIVE_ID) {
    console.error('💥 CRITICAL ERROR DETECTED: DEFAULT_GOOGLE_DOC_ID is set to the Shared Drive ID!');
    console.error(`🔧 CORRECTING: Using correct template ID instead: ${CORRECT_TEMPLATE_DOC_ID}`);
    templateDocId = CORRECT_TEMPLATE_DOC_ID;
  }
  
  // Validate IDs are not missing
  if (!templateDocId) {
    console.error('💥 CRITICAL ERROR: DEFAULT_GOOGLE_DOC_ID is missing');
    templateDocId = CORRECT_TEMPLATE_DOC_ID;
    console.error(`🔧 FALLBACK: Using hardcoded template ID: ${templateDocId}`);
  }
  
  if (!sharedDriveId) {
    console.error('💥 CRITICAL ERROR: GOOGLE_SHARED_DRIVE_ID is missing');
    sharedDriveId = CORRECT_SHARED_DRIVE_ID;
    console.error(`🔧 FALLBACK: Using hardcoded shared drive ID: ${sharedDriveId}`);
  }
  
  // Final validation - ensure they're different
  if (templateDocId === sharedDriveId) {
    console.error('💥 FINAL VALIDATION ERROR: Template and Shared Drive IDs are still the same after validation!');
    console.error('🔧 EMERGENCY CORRECTION: Forcing correct template ID');
    templateDocId = CORRECT_TEMPLATE_DOC_ID;
  }
  
  // Validate ID formats
  if (templateDocId && !templateDocId.match(/^1[a-zA-Z0-9_-]{15,}/)) {
    console.warn(`⚠️ Template ID format looks suspicious: ${templateDocId}`);
    console.warn('🔧 Expected format: starts with "1" and 15+ characters');
  }
  
  if (sharedDriveId && !sharedDriveId.match(/^0[a-zA-Z0-9_-]{15,}/)) {
    console.warn(`⚠️ Shared Drive ID format looks suspicious: ${sharedDriveId}`);
    console.warn('🔧 Expected format: starts with "0" and 15+ characters');
  }
  
  console.log('✅ === FINAL VALIDATED IDs ===');
  console.log(`📄 Template Document ID: "${templateDocId}"`);
  console.log(`📁 Shared Drive ID: "${sharedDriveId}"`);
  console.log(`🔍 Are they different? ${templateDocId !== sharedDriveId ? 'YES ✅' : 'NO ❌'}`);
  console.log('==========================================');
  
  return { templateDocId, sharedDriveId };
}

// Detailed debug function to diagnose Shared Drive permission issues
export async function debugSharedDrivePermissions(accessToken: string) {
  const { templateDocId, sharedDriveId } = validateAndGetEnvironmentVariables();
  
  console.log('🔍 Debugging Shared Drive Permissions in Detail...');
  
  // Critical validation - ensure IDs are different and valid
  if (!templateDocId || !sharedDriveId) {
    console.error('💥 CRITICAL ERROR: Missing environment variables after validation!');
    return { success: false, error: 'Missing required environment variables' };
  }
  
  if (templateDocId === sharedDriveId) {
    console.error('💥 CRITICAL ERROR: Template Document ID and Shared Drive ID are STILL the same after validation!');
    console.error(`Both are set to: ${templateDocId}`);
    return { success: false, error: 'Configuration error: Template and Shared Drive IDs cannot be identical' };
  }

  try {
    // Step 1: List all drives the service account can see
    console.log('\n📋 Step 1: Listing all accessible drives...');
    const drivesResponse = await fetch('https://www.googleapis.com/drive/v3/drives?pageSize=100', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (drivesResponse.ok) {
      const drivesData = await drivesResponse.json();
      console.log(`Found ${drivesData.drives?.length || 0} accessible drives:`);
      
      drivesData.drives?.forEach((drive: any, index: number) => {
        console.log(`  ${index + 1}. "${drive.name}" (ID: ${drive.id})`);
        if (drive.id === sharedDriveId) {
          console.log(`     ✅ This is our target drive!`);
        }
      });
    } else {
      console.log('❌ Cannot list drives:', await drivesResponse.text());
    }

    // Step 2: Get specific drive details
    console.log('\n📁 Step 2: Getting drive details...');
    const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (driveResponse.ok) {
      const driveData = await driveResponse.json();
      console.log(`✅ Drive accessible: "${driveData.name}"`);
      console.log('Drive capabilities:', JSON.stringify(driveData.capabilities, null, 2));
      console.log('Drive restrictions:', JSON.stringify(driveData.restrictions, null, 2));
    } else {
      console.log('❌ Cannot access drive details:', await driveResponse.text());
    }

    // Step 3: List existing files in the drive
    console.log('\n📄 Step 3: Listing files in drive...');
    const filesResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&fields=files(id,name,mimeType,capabilities)`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (filesResponse.ok) {
      const filesData = await filesResponse.json();
      console.log(`Found ${filesData.files?.length || 0} files in drive:`);
      filesData.files?.forEach((file: any) => {
        console.log(`  - ${file.name} (${file.mimeType})`);
        console.log(`    Capabilities:`, JSON.stringify(file.capabilities, null, 2));
      });
    } else {
      console.log('❌ Cannot list files:', await filesResponse.text());
    }

    // Step 4: Try different document creation approaches
    console.log('\n🧪 Step 4: Testing document creation methods...');

    // Method 1: Direct creation in drive
    console.log('Testing Method 1: Direct creation...');
    try {
      const method1Response = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `test-direct-${Date.now()}`,
          mimeType: 'application/vnd.google-apps.document',
          parents: [sharedDriveId]
        })
      });

      if (method1Response.ok) {
        const testFile = await method1Response.json();
        console.log('✅ Method 1 SUCCESS - Direct creation works');
        
        // Clean up
        await fetch(`https://www.googleapis.com/drive/v3/files/${testFile.id}?supportsAllDrives=true`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        return { success: true, workingMethod: 'direct' };
      } else {
        const errorText = await method1Response.text();
        console.log('❌ Method 1 FAILED:', errorText);
      }
    } catch (error) {
      console.log('❌ Method 1 ERROR:', error.message);
    }

    // Method 2: Copy template to drive - CRITICAL FIX HERE
    console.log('Testing Method 2: Template copy...');
    console.log(`🔍 FINAL VERIFICATION - Template ID: "${templateDocId}"`);
    console.log(`🔍 FINAL VERIFICATION - Shared Drive ID: "${sharedDriveId}"`);
    console.log(`🔍 FINAL VERIFICATION - Are they different? ${templateDocId !== sharedDriveId ? 'YES ✅' : 'NO ❌'}`);
    console.log(`🔍 Copy URL will be: https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`);
    
    try {
      // CRITICAL: Triple-check we're using the TEMPLATE document ID, not the Shared Drive ID
      if (templateDocId === sharedDriveId) {
        throw new Error(`FATAL: Template ID equals Shared Drive ID: ${templateDocId}`);
      }
      
      if (templateDocId.startsWith('0A')) {
        throw new Error(`FATAL: Template ID looks like a Drive ID (starts with 0A): ${templateDocId}`);
      }
      
      const copyUrl = `https://www.googleapis.com/drive/v3/files/${templateDocId}/copy?supportsAllDrives=true`;
      console.log(`🔗 Making request to: ${copyUrl}`);
      
      const method2Response = await fetch(copyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `test-copy-${Date.now()}`,
          parents: [sharedDriveId]  // This is correct - copying TO the Shared Drive
        })
      });

      if (method2Response.ok) {
        const testCopy = await method2Response.json();
        console.log('✅ Method 2 SUCCESS - Template copy works');
        console.log(`✅ Successfully copied template ${templateDocId} to Shared Drive ${sharedDriveId}`);
        
        // Clean up
        await fetch(`https://www.googleapis.com/drive/v3/files/${testCopy.id}?supportsAllDrives=true`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        return { success: true, workingMethod: 'copy' };
      } else {
        const errorText = await method2Response.text();
        console.log('❌ Method 2 FAILED:', errorText);
        console.log(`❌ Failed URL: ${copyUrl}`);
        console.log(`❌ Template ID used: ${templateDocId}`);
        console.log(`❌ Shared Drive ID used: ${sharedDriveId}`);
        
        // Parse the specific error
        try {
          const errorData = JSON.parse(errorText);
          console.log('Error details:', errorData);
          
          if (errorData.error?.message?.includes('insufficientPermissions')) {
            console.log('💡 DIAGNOSIS: Insufficient permissions despite UI showing Content Manager');
            console.log('   This might be a permission propagation delay or API vs UI inconsistency');
          }
          
          if (errorData.error?.message?.includes('quotaExceeded')) {
            console.log('💡 DIAGNOSIS: Quota exceeded in Shared Drive');
          }
          
          if (errorData.error?.message?.includes('File not found')) {
            console.log('💡 DIAGNOSIS: Template document not found or not accessible');
            console.log(`   Check if template document ${templateDocId} exists and is accessible`);
            console.log(`   CRITICAL: If this shows a Drive ID (0A...), then env var is wrong!`);
          }
        } catch {
          // Error text is not JSON
        }
      }
    } catch (error) {
      console.log('❌ Method 2 ERROR:', error.message);
    }

    // Method 3: Try without specifying parents (let it go to root)
    console.log('Testing Method 3: Root-level creation...');
    try {
      const method3Response = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `test-root-${Date.now()}`,
          mimeType: 'application/vnd.google-apps.document',
          driveId: sharedDriveId
          // No parents specified
        })
      });

      if (method3Response.ok) {
        const testRoot = await method3Response.json();
        console.log('✅ Method 3 SUCCESS - Root creation works');
        
        // Clean up
        await fetch(`https://www.googleapis.com/drive/v3/files/${testRoot.id}?supportsAllDrives=true`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        return { success: true, workingMethod: 'root' };
      } else {
        const errorText = await method3Response.text();
        console.log('❌ Method 3 FAILED:', errorText);
      }
    } catch (error) {
      console.log('❌ Method 3 ERROR:', error.message);
    }

    console.log('\n💥 All methods failed');
    return { success: false, workingMethod: null };

  } catch (error) {
    console.error('Debug failed:', error);
    return { success: false, error: error.message };
  }
}

// Simplified permission check
export async function checkActualPermissions(accessToken: string) {
  const { sharedDriveId } = validateAndGetEnvironmentVariables();
  
  console.log('🔍 Checking ACTUAL permissions (not UI)...');
  console.log(`📁 Checking permissions for Shared Drive: ${sharedDriveId}`);
  
  try {
    // Get drive with permissions info
    const response = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}?fields=*`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('🔍 Full drive data:', JSON.stringify(data, null, 2));
      
      // Check capabilities specifically
      const capabilities = data.capabilities || {};
      console.log('📋 Drive Capabilities:');
      console.log(`  canAddChildren: ${capabilities.canAddChildren}`);
      console.log(`  canCopy: ${capabilities.canCopy}`);
      console.log(`  canEdit: ${capabilities.canEdit}`);
      console.log(`  canManageMembers: ${capabilities.canManageMembers}`);
      
      return capabilities;
    } else {
      console.log('❌ Cannot get permissions:', await response.text());
      return null;
    }
  } catch (error) {
    console.log('❌ Permission check failed:', error);
    return null;
  }
}

export const quickSetupCheck = (): SetupCheckResult => {
  console.log('🔍 Running quick setup verification...');
  
  const result: SetupCheckResult = {
    valid: true,
    issues: [],
    recommendations: []
  };

  // Use validated environment variables
  const { templateDocId, sharedDriveId } = validateAndGetEnvironmentVariables();
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');

  console.log(`🔍 Template Document ID: ${templateDocId}`);
  console.log(`🔍 Shared Drive ID: ${sharedDriveId}`);

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
  
  const { templateDocId, sharedDriveId } = validateAndGetEnvironmentVariables();

  // Log IDs for verification
  console.log(`📄 Using Template Document ID: ${templateDocId}`);
  console.log(`📁 Using Shared Drive ID: ${sharedDriveId}`);

  const result: IDVerificationResult = {
    templateDoc: { accessible: false },
    sharedDrive: { accessible: false }
  };

  // Verify service account email
  try {
    const credentials = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY') || '{}');
    console.log('🔍 Service account email from credentials:', credentials.client_email);
  } catch (error) {
    console.log('⚠️ Could not parse service account credentials');
  }

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

  // Verify Shared Drive with comprehensive debugging
  if (sharedDriveId) {
    try {
      console.log(`🔍 Testing Shared Drive access: ${sharedDriveId}`);
      
      // Run comprehensive debug
      console.log('🧪 Running comprehensive Shared Drive debug...');
      const debugResult = await debugSharedDrivePermissions(accessToken);
      console.log('Debug result:', JSON.stringify(debugResult, null, 2));

      console.log('🔍 Checking actual API permissions...');
      const permissions = await checkActualPermissions(accessToken);
      
      const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}?fields=id,name,capabilities`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (driveResponse.ok) {
        const driveData = await driveResponse.json();
        result.sharedDrive.name = driveData.name;
        result.sharedDrive.capabilities = driveData.capabilities;
        
        console.log(`✅ Shared Drive accessible: "${driveData.name}"`);
        
        // If debug found a working method, use that
        if (debugResult.success && debugResult.workingMethod) {
          result.sharedDrive.accessible = true;
          result.sharedDrive.workingMethod = debugResult.workingMethod;
          console.log(`✅ Document creation works using method: ${debugResult.workingMethod}`);
        } else {
          result.sharedDrive.accessible = false;
          result.sharedDrive.error = 'Cannot create documents in Shared Drive - all creation methods failed. Check that the service account has Editor permissions and that permissions have propagated (may take 5-10 minutes).';
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
