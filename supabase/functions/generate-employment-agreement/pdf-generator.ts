import { createEmploymentPlaceholders } from './placeholders.ts';
import { generateEmploymentWithSharedDrive } from './google-docs-shared-drive.ts';
import { runComprehensiveSharedDriveDiagnostics, logDiagnosticResults } from './shared-drive-diagnostics.ts';
import { validateAndCorrectEnvironmentVariables, logEnvironmentIssues } from './environment-validation.ts';

export async function generateAgreementPDF(employmentData, templateDocId) {
  console.log(`🔄 Starting Employment Agreement PDF generation for: ${employmentData.first_name} ${employmentData.last_name}`);
  
  // Step 1: Validate and correct environment variables
  const envValidation = validateAndCorrectEnvironmentVariables();
  logEnvironmentIssues(envValidation);
  
  if (!envValidation.valid || !envValidation.correctedVars) {
    throw new Error(`Environment configuration error: ${envValidation.issues.join('; ')}`);
  }
  
  const { templateDocId: correctedTemplateId } = envValidation.correctedVars;
  const finalTemplateId = templateDocId || correctedTemplateId;
  
  console.log(`📋 Using template document ID: ${finalTemplateId}`);
  
  // Step 2: Create placeholders
  const placeholders = createEmploymentPlaceholders(employmentData);
  console.log(`📝 Prepared placeholders: ${JSON.stringify(Object.keys(placeholders), null, 2)}`);
  
  try {
    // Step 3: Run pre-flight diagnostics
    console.log('🔍 Running pre-flight diagnostics...');
    const diagnosticResult = await runComprehensiveSharedDriveDiagnostics();
    logDiagnosticResults(diagnosticResult);
    
    if (diagnosticResult.status === 'success') {
      console.log('🔄 Attempting Shared Drive workflow...');
      try {
        const pdfBuffer = await generateEmploymentWithSharedDrive(finalTemplateId, placeholders, employmentData);
        console.log('✅ Shared Drive workflow completed successfully');
        return pdfBuffer;
      } catch (sharedDriveError) {
        console.error('💥 Shared Drive workflow failed:', sharedDriveError.message);
        throw new Error(`Shared Drive workflow failed: ${sharedDriveError.message}`);
      }
    } else {
      // Diagnostic failed - provide detailed error
      const recommendations = diagnosticResult.recommendations.join('; ');
      throw new Error(`Shared Drive configuration error: Shared Drive pre-flight check failed. Status: ${diagnosticResult.status}. Recommendations: ${recommendations}`);
    }
  } catch (error) {
    console.error('💥 PDF generation completely failed:', error.message);
    throw new Error(`Shared Drive configuration error: ${error.message}`);
  }
}