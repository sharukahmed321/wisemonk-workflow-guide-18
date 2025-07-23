
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

// Known correct IDs
const KNOWN_TEMPLATE_DOC_ID = '1Z0x-xjzqU5aKPFLrcdx7lX0Hb-NGVZpuygjQiSffpu8';
const KNOWN_SHARED_DRIVE_ID = '0AJLtAJTQC6NLUk9PVA';

export function validateAndCorrectEnvironmentVariables(): ValidationResult {
  const rawTemplateDocId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID');
  const rawSharedDriveId = Deno.env.get('GOOGLE_SHARED_DRIVE_ID');
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  
  const result: ValidationResult = {
    valid: true,
    issues: []
  };
  
  // Critical validation: Service account key
  if (!serviceAccountKey) {
    result.valid = false;
    result.issues.push('GOOGLE_SERVICE_ACCOUNT_KEY is missing');
  }
  
  // Fix: Check if DEFAULT_GOOGLE_DOC_ID is incorrectly set to Shared Drive ID
  let templateDocId = rawTemplateDocId;
  let sharedDriveId = rawSharedDriveId;
  
  if (rawTemplateDocId === KNOWN_SHARED_DRIVE_ID || rawTemplateDocId === rawSharedDriveId) {
    templateDocId = KNOWN_TEMPLATE_DOC_ID;
    result.issues.push(`DEFAULT_GOOGLE_DOC_ID was incorrectly set to Shared Drive ID. Auto-corrected to: ${KNOWN_TEMPLATE_DOC_ID}`);
  }
  
  if (!templateDocId) {
    templateDocId = KNOWN_TEMPLATE_DOC_ID;
    result.issues.push(`DEFAULT_GOOGLE_DOC_ID was missing. Using fallback: ${KNOWN_TEMPLATE_DOC_ID}`);
  }
  
  if (!sharedDriveId) {
    sharedDriveId = KNOWN_SHARED_DRIVE_ID;
    result.issues.push(`GOOGLE_SHARED_DRIVE_ID was missing. Using fallback: ${KNOWN_SHARED_DRIVE_ID}`);
  }
  
  // Final validation - ensure they're different
  if (templateDocId === sharedDriveId) {
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
  
  return result;
}
