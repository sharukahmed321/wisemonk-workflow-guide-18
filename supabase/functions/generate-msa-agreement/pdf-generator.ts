
import { createMSAPlaceholders } from './placeholders.ts';
import { generateMSAWithSharedDrive } from './google-docs-shared-drive.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

export async function generateAgreementPDF(msaData: any): Promise<Uint8Array> {
  // Validate and correct environment variables
  const envValidation = validateAndCorrectEnvironmentVariables();
  
  if (!envValidation.valid || !envValidation.correctedVars) {
    throw new Error(`Environment configuration error: ${envValidation.issues.join('; ')}`);
  }
  
  const { templateDocId } = envValidation.correctedVars;
  
  // Create placeholders
  const placeholders = createMSAPlaceholders(msaData);
  
  // Generate the MSA agreement PDF using Shared Drive workflow
  const pdfBuffer = await generateMSAWithSharedDrive(templateDocId, placeholders, msaData);
  
  return pdfBuffer;
}
