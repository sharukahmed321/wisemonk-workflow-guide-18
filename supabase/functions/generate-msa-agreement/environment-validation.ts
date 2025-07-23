
// Simplified environment variable validation for production
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
  
  // Auto-correct template and shared drive IDs
  let templateDocId = rawTemplateDocId;
  let sharedDriveId = rawSharedDriveId;
  
  // Fix common configuration errors
  if (rawTemplateDocId === KNOWN_SHARED_DRIVE_ID || rawTemplateDocId === rawSharedDriveId) {
    templateDocId = KNOWN_TEMPLATE_DOC_ID;
  }
  
  if (!templateDocId) {
    templateDocId = KNOWN_TEMPLATE_DOC_ID;
  }
  
  if (!sharedDriveId) {
    sharedDriveId = KNOWN_SHARED_DRIVE_ID;
  }
  
  // Ensure they're different
  if (templateDocId === sharedDriveId) {
    templateDocId = KNOWN_TEMPLATE_DOC_ID;
    sharedDriveId = KNOWN_SHARED_DRIVE_ID;
    result.valid = false;
    result.issues.push('Template and Shared Drive IDs corrected');
  }
  
  result.correctedVars = {
    templateDocId,
    sharedDriveId,
    serviceAccountKey: serviceAccountKey || ''
  };
  
  return result;
}
