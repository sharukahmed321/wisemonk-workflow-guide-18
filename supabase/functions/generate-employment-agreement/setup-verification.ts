import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

export function quickSetupCheck() {
  console.log('🔍 Running quick setup verification for Employment Agreement...');
  
  const issues = [];
  const recommendations = [];
  
  // Check required environment variables
  if (!Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')) {
    issues.push('GOOGLE_SERVICE_ACCOUNT_KEY missing');
    recommendations.push('Set GOOGLE_SERVICE_ACCOUNT_KEY in Supabase secrets');
  }
  
  if (!Deno.env.get('GOOGLE_SHARED_DRIVE_ID')) {
    issues.push('GOOGLE_SHARED_DRIVE_ID missing');
    recommendations.push('Set GOOGLE_SHARED_DRIVE_ID in Supabase secrets');
  }
  
  // Check for template document ID
  const hasEmploymentTemplate = !!Deno.env.get('DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID');
  const hasGenericTemplate = !!Deno.env.get('DEFAULT_GOOGLE_DOC_ID');
  
  if (!hasEmploymentTemplate && !hasGenericTemplate) {
    issues.push('No template document ID available');
    recommendations.push('Set DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID in Supabase secrets');
  } else if (!hasEmploymentTemplate) {
    recommendations.push('Consider setting DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID for employment-specific template');
  }
  
  const valid = issues.length === 0;
  
  if (valid) {
    console.log('✅ Quick setup verification passed');
  } else {
    console.log('❌ Quick setup verification failed:', issues.join(', '));
  }
  
  return { valid, issues, recommendations };
}

export async function verifyBothIDs(accessToken) {
  console.log('🔍 Verifying both template document and Shared Drive access...');
  
  const envValidation = validateAndCorrectEnvironmentVariables();
  if (!envValidation.valid || !envValidation.correctedVars) {
    throw new Error('Environment validation failed');
  }
  
  const { templateDocId, sharedDriveId } = envValidation.correctedVars;
  
  const result = {
    templateDoc: {
      accessible: false,
      error: null
    },
    sharedDrive: {
      accessible: false,
      error: null
    }
  };
  
  // Test template document access
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
      console.log(`✅ Template document verified: ${templateData.name}`);
    } else {
      const errorText = await templateResponse.text();
      result.templateDoc.error = `Cannot access template document (${templateResponse.status}): ${errorText}`;
      console.error(`❌ Template document verification failed: ${errorText}`);
    }
  } catch (error) {
    result.templateDoc.error = `Template document verification error: ${error.message}`;
    console.error('❌ Template document verification failed:', error);
  }
  
  // Test Shared Drive access
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
      console.log(`✅ Shared Drive verified: ${driveData.name}`);
    } else {
      const errorText = await driveResponse.text();
      result.sharedDrive.error = `Cannot access Shared Drive (${driveResponse.status}): ${errorText}`;
      console.error(`❌ Shared Drive verification failed: ${errorText}`);
    }
  } catch (error) {
    result.sharedDrive.error = `Shared Drive verification error: ${error.message}`;
    console.error('❌ Shared Drive verification failed:', error);
  }
  
  return result;
}