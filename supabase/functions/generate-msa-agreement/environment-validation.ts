
// Environment variable validation and correction module
export interface ValidatedEnvironmentVars {
  templateDocId: string;
  sharedDriveId: string;
  serviceAccountKey: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  correctedVars?: ValidatedEnvironmentVars;
}

// Known correct IDs based on system analysis
const KNOWN_TEMPLATE_DOC_ID = '1Z0x-xjzqU5aKPFLrcdx7lX0Hb-NGVZpuygjQiSffpu8';
const KNOWN_SHARED_DRIVE_ID = '0AJLtAJTQC6NLUk9PVA';

export function validateAndCorrectEnvironmentVariables(): ValidationResult {
  console.log('🔍 === ENVIRONMENT VARIABLE VALIDATION & CORRECTION ===');
  
  const rawTemplateDocId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID');
  const rawSharedDriveId = Deno.env.get('GOOGLE_SHARED_DRIVE_ID');
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  
  console.log(`📄 Raw DEFAULT_GOOGLE_DOC_ID: "${rawTemplateDocId}"`);
  console.log(`📁 Raw GOOGLE_SHARED_DRIVE_ID: "${rawSharedDriveId}"`);
  
  const result: ValidationResult = {
    valid: true,
    issues: []
  };
  
  // Critical validation: Service account key
  if (!serviceAccountKey) {
    result.valid = false;
    result.issues.push('GOOGLE_SERVICE_ACCOUNT_KEY is missing');
  }
  
  // Critical fix: Check if DEFAULT_GOOGLE_DOC_ID is incorrectly set to Shared Drive ID
  let templateDocId = rawTemplateDocId;
  let sharedDriveId = rawSharedDriveId;
  
  if (rawTemplateDocId === KNOWN_SHARED_DRIVE_ID || rawTemplateDocId === rawSharedDriveId) {
    console.error('💥 CRITICAL ERROR: DEFAULT_GOOGLE_DOC_ID is set to Shared Drive ID!');
    console.error(`🔧 CORRECTING: Using known template ID: ${KNOWN_TEMPLATE_DOC_ID}`);
    templateDocId = KNOWN_TEMPLATE_DOC_ID;
    result.issues.push(`DEFAULT_GOOGLE_DOC_ID was incorrectly set to Shared Drive ID. Auto-corrected to: ${KNOWN_TEMPLATE_DOC_ID}`);
  }
  
  if (!templateDocId) {
    console.error('💥 Template ID missing, using known fallback');
    templateDocId = KNOWN_TEMPLATE_DOC_ID;
    result.issues.push(`DEFAULT_GOOGLE_DOC_ID was missing. Using fallback: ${KNOWN_TEMPLATE_DOC_ID}`);
  }
  
  if (!sharedDriveId) {
    console.error('💥 Shared Drive ID missing, using known fallback');
    sharedDriveId = KNOWN_SHARED_DRIVE_ID;
    result.issues.push(`GOOGLE_SHARED_DRIVE_ID was missing. Using fallback: ${KNOWN_SHARED_DRIVE_ID}`);
  }
  
  // Format validation
  if (!templateDocId.match(/^1[a-zA-Z0-9_-]{15,}/)) {
    result.issues.push(`Template ID format suspicious: ${templateDocId} (should start with "1")`);
  }
  
  if (!sharedDriveId.match(/^0[a-zA-Z0-9_-]{15,}/)) {
    result.issues.push(`Shared Drive ID format suspicious: ${sharedDriveId} (should start with "0")`);
  }
  
  // Final validation - ensure they're different
  if (templateDocId === sharedDriveId) {
    console.error('💥 FINAL ERROR: Template and Shared Drive IDs are still identical!');
    templateDocId = KNOWN_TEMPLATE_DOC_ID;
    sharedDriveId = KNOWN_SHARED_DRIVE_ID;
    result.valid = false;
    result.issues.push('Template and Shared Drive IDs cannot be identical. Force-corrected both.');
  }
  
  result.correctedVars = {
    templateDocId,
    sharedDriveId,
    serviceAccountKey: serviceAccountKey || ''
  };
  
  console.log('✅ === VALIDATED & CORRECTED IDs ===');
  console.log(`📄 Template Document ID: "${templateDocId}"`);
  console.log(`📁 Shared Drive ID: "${sharedDriveId}"`);
  console.log(`🔍 Are they different? ${templateDocId !== sharedDriveId ? 'YES ✅' : 'NO ❌'}`);
  console.log('===============================================');
  
  return result;
}

export function logEnvironmentIssues(result: ValidationResult): void {
  if (result.issues.length > 0) {
    console.warn('⚠️ Environment Variable Issues Detected:');
    result.issues.forEach(issue => console.warn(`   ⚠️ ${issue}`));
    console.warn('💡 Please update your Supabase environment variables:');
    console.warn(`   📄 Set DEFAULT_GOOGLE_DOC_ID to: ${KNOWN_TEMPLATE_DOC_ID}`);
    console.warn(`   📁 Set GOOGLE_SHARED_DRIVE_ID to: ${KNOWN_SHARED_DRIVE_ID}`);
  }
}
