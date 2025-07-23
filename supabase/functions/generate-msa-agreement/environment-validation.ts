
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
  debugInfo?: any;
}

// Known correct IDs
const KNOWN_TEMPLATE_DOC_ID = '1Z0x-xjzqU5aKPFLrcdx7lX0Hb-NGVZpuygjQiSffpu8';
const KNOWN_SHARED_DRIVE_ID = '0AJLtAJTQC6NLUk9PVA';

export function validateAndCorrectEnvironmentVariables(): ValidationResult {
  const rawTemplateDocId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID');
  const rawSharedDriveId = Deno.env.get('GOOGLE_SHARED_DRIVE_ID');
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  
  console.log('🔍 Environment Variables Debug:');
  console.log('  DEFAULT_GOOGLE_DOC_ID:', rawTemplateDocId || 'NOT SET');
  console.log('  GOOGLE_SHARED_DRIVE_ID:', rawSharedDriveId || 'NOT SET');
  console.log('  SERVICE_ACCOUNT_KEY:', serviceAccountKey ? 'SET' : 'NOT SET');
  
  const result: ValidationResult = {
    valid: true,
    issues: [],
    debugInfo: {
      originalTemplateDocId: rawTemplateDocId,
      originalSharedDriveId: rawSharedDriveId,
      serviceAccountKeyPresent: !!serviceAccountKey
    }
  };
  
  // Critical validation: Service account key
  if (!serviceAccountKey) {
    result.valid = false;
    result.issues.push('❌ GOOGLE_SERVICE_ACCOUNT_KEY is missing');
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY is missing');
  }
  
  // Validate ID formats
  const validateGoogleDocId = (id: string) => {
    return id && id.length > 20 && id.includes('-') && !id.includes('/');
  };
  
  const validateSharedDriveId = (id: string) => {
    return id && id.length > 10 && id.length < 30 && !id.includes('-');
  };
  
  // Fix: Check if DEFAULT_GOOGLE_DOC_ID is incorrectly set to Shared Drive ID
  let templateDocId = rawTemplateDocId;
  let sharedDriveId = rawSharedDriveId;
  
  // Check if template ID is actually the shared drive ID
  if (rawTemplateDocId === KNOWN_SHARED_DRIVE_ID || rawTemplateDocId === rawSharedDriveId) {
    console.warn('⚠️ DEFAULT_GOOGLE_DOC_ID was set to shared drive ID, correcting...');
    templateDocId = KNOWN_TEMPLATE_DOC_ID;
    result.issues.push(`⚠️ DEFAULT_GOOGLE_DOC_ID was incorrectly set to shared drive ID (${rawTemplateDocId}). Auto-corrected to: ${KNOWN_TEMPLATE_DOC_ID}`);
  }
  
  // Check if shared drive ID is actually the template ID
  if (rawSharedDriveId === KNOWN_TEMPLATE_DOC_ID || rawSharedDriveId === rawTemplateDocId) {
    console.warn('⚠️ GOOGLE_SHARED_DRIVE_ID was set to template doc ID, correcting...');
    sharedDriveId = KNOWN_SHARED_DRIVE_ID;
    result.issues.push(`⚠️ GOOGLE_SHARED_DRIVE_ID was incorrectly set to template doc ID (${rawSharedDriveId}). Auto-corrected to: ${KNOWN_SHARED_DRIVE_ID}`);
  }
  
  // Use fallbacks if missing
  if (!templateDocId) {
    templateDocId = KNOWN_TEMPLATE_DOC_ID;
    result.issues.push(`⚠️ DEFAULT_GOOGLE_DOC_ID was missing. Using fallback: ${KNOWN_TEMPLATE_DOC_ID}`);
    console.warn('⚠️ DEFAULT_GOOGLE_DOC_ID missing, using fallback');
  }
  
  if (!sharedDriveId) {
    sharedDriveId = KNOWN_SHARED_DRIVE_ID;
    result.issues.push(`⚠️ GOOGLE_SHARED_DRIVE_ID was missing. Using fallback: ${KNOWN_SHARED_DRIVE_ID}`);
    console.warn('⚠️ GOOGLE_SHARED_DRIVE_ID missing, using fallback');
  }
  
  // Validate ID formats
  if (!validateGoogleDocId(templateDocId)) {
    result.valid = false;
    result.issues.push(`❌ Invalid template document ID format: ${templateDocId}`);
    console.error('❌ Invalid template document ID format:', templateDocId);
  }
  
  if (!validateSharedDriveId(sharedDriveId)) {
    result.valid = false;
    result.issues.push(`❌ Invalid shared drive ID format: ${sharedDriveId}`);
    console.error('❌ Invalid shared drive ID format:', sharedDriveId);
  }
  
  // Final validation - ensure they're different
  if (templateDocId === sharedDriveId) {
    console.error('❌ Template and Shared Drive IDs are identical, force-correcting');
    templateDocId = KNOWN_TEMPLATE_DOC_ID;
    sharedDriveId = KNOWN_SHARED_DRIVE_ID;
    result.valid = false;
    result.issues.push('❌ Template and Shared Drive IDs cannot be identical. Force-corrected both.');
  }
  
  // Log final corrected values
  console.log('✅ Final corrected values:');
  console.log('  Template Document ID:', templateDocId);
  console.log('  Shared Drive ID:', sharedDriveId);
  console.log('  Service Account Key:', serviceAccountKey ? 'Present' : 'Missing');
  
  result.correctedVars = {
    templateDocId,
    sharedDriveId,
    serviceAccountKey: serviceAccountKey || ''
  };
  
  result.debugInfo = {
    ...result.debugInfo,
    finalTemplateDocId: templateDocId,
    finalSharedDriveId: sharedDriveId,
    correctionsMade: result.issues.length > 0
  };
  
  return result;
}
