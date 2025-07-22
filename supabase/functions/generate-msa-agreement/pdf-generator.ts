
import { generateMSAWithSharedDrive } from './google-docs-shared-drive.ts';
import { generateMSAPDFEnhanced } from './google-docs-enhanced.ts';
import { generateFallbackMSAPDF } from './fallback-generator.ts';
import { createMSAPlaceholders } from './placeholders.ts';
import { validateSharedDriveBeforeOperation } from './shared-drive-monitor.ts';
import { cleanupSharedDriveOrphanedDocuments } from './google-docs-shared-drive.ts';
import { runComprehensiveDiagnostics, logDiagnosticResults } from './shared-drive-diagnostics.ts';

export const generateAgreementPDF = async (msaData: any, templateDocId: string): Promise<ArrayBuffer> => {
  if (!templateDocId) {
    throw new Error('Template document ID is required. Please configure DEFAULT_GOOGLE_DOC_ID in your environment secrets.');
  }

  console.log('🔄 Starting MSA PDF generation for:', msaData.first_name, msaData.last_name);
  console.log('📋 Using template document ID:', templateDocId);
  
  try {
    // Prepare placeholder replacements
    const placeholders = createMSAPlaceholders(msaData);
    console.log('📝 Prepared placeholders:', Object.keys(placeholders));
    
    // Step 1: Try Shared Drive workflow first (most reliable)
    const sharedDriveId = Deno.env.get('GOOGLE_SHARED_DRIVE_ID');
    if (sharedDriveId) {
      try {
        console.log('🔄 Attempting Shared Drive workflow...');
        console.log('📁 Shared Drive ID:', sharedDriveId);
        console.log('📄 Template Document ID:', templateDocId);
        
        // Run comprehensive diagnostics first
        console.log('🔍 Running pre-flight diagnostics...');
        const diagnostics = await runComprehensiveDiagnostics();
        logDiagnosticResults(diagnostics);
        
        if (diagnostics.overallStatus !== 'ready') {
          throw new Error(`Shared Drive pre-flight check failed. Status: ${diagnostics.overallStatus}. Recommendations: ${diagnostics.recommendations.join('; ')}`);
        }
        
        console.log('✅ Pre-flight diagnostics passed, proceeding with Shared Drive workflow...');
        
        // Validate Shared Drive before operation
        await validateSharedDriveBeforeOperation();
        
        // Clean up any orphaned documents
        await cleanupSharedDriveOrphanedDocuments();
        
        // Generate PDF using Shared Drive workflow
        const pdfBuffer = await generateMSAWithSharedDrive(templateDocId, placeholders, msaData);
        
        console.log('✅ MSA PDF generated successfully with Shared Drive workflow, size:', pdfBuffer.byteLength);
        return pdfBuffer.buffer;
        
      } catch (sharedDriveError) {
        console.error('💥 Shared Drive workflow failed:', sharedDriveError.message);
        
        // Log specific error details for debugging
        if (sharedDriveError.message.includes('File not found')) {
          console.error('🔍 Template document not found. Verify DEFAULT_GOOGLE_DOC_ID:', templateDocId);
          console.error('🔍 Or Shared Drive not found. Verify GOOGLE_SHARED_DRIVE_ID:', sharedDriveId);
        } else if (sharedDriveError.message.includes('pre-flight check failed')) {
          console.error('🔍 Configuration issue detected. Please review diagnostic recommendations above.');
          // Don't continue to fallback for configuration issues - user needs to fix setup
          throw new Error(`Shared Drive configuration error: ${sharedDriveError.message}`);
        }
        
        // Continue to next method for other types of errors
        console.log('🔄 Falling back to enhanced Google Docs workflow...');
      }
    } else {
      console.log('⚠️ GOOGLE_SHARED_DRIVE_ID not configured, skipping Shared Drive workflow');
    }
    
    // Step 2: Try enhanced Google Docs workflow
    try {
      console.log('🔄 Attempting enhanced Google Docs workflow...');
      const pdfBuffer = await generateMSAPDFEnhanced(templateDocId, placeholders, msaData);
      
      console.log('✅ MSA PDF generated successfully with enhanced Google Docs workflow, size:', pdfBuffer.byteLength);
      return pdfBuffer.buffer;
      
    } catch (googleDocsError) {
      console.error('💥 Enhanced Google Docs workflow failed:', googleDocsError.message);
      
      // Check if this is a storage quota issue
      if (googleDocsError.message.includes('storage quota') || 
          googleDocsError.message.includes('storageQuotaExceeded') ||
          googleDocsError.message.includes('Insufficient') ||
          googleDocsError.message.includes('0.00MB available')) {
        
        console.log('🔄 Falling back to HTML-to-PDF generation due to storage quota issue...');
        
        try {
          const fallbackPdfBuffer = await generateFallbackMSAPDF(msaData);
          console.log('✅ MSA PDF generated successfully with fallback method, size:', fallbackPdfBuffer.byteLength);
          return fallbackPdfBuffer.buffer;
          
        } catch (fallbackError) {
          console.error('💥 Fallback PDF generation also failed:', fallbackError.message);
          throw new Error(`All PDF generation methods failed. Shared Drive error: ${sharedDriveId ? 'Failed with configuration issues' : 'Not configured'}. Google Docs error: ${googleDocsError.message}. Fallback error: ${fallbackError.message}`);
        }
        
      } else {
        // For non-storage issues, provide specific error guidance
        if (googleDocsError.message.includes('permission') || googleDocsError.message.includes('access')) {
          throw new Error('Google Docs access denied. Please ensure the template document is shared with the service account email with Editor permissions.');
        } else if (googleDocsError.message.includes('not found') || googleDocsError.message.includes('404')) {
          throw new Error(`Google Docs template not found. Please verify the template document ID (${templateDocId}) is correct and the document exists.`);
        } else if (googleDocsError.message.includes('authentication') || googleDocsError.message.includes('401')) {
          throw new Error('Google authentication failed. Please check the GOOGLE_SERVICE_ACCOUNT_KEY configuration.');
        } else if (googleDocsError.message.includes('Rate limited') || googleDocsError.message.includes('429')) {
          throw new Error('Google API rate limit exceeded. Please try again in a few moments.');
        }
        
        throw new Error(`Failed to generate MSA agreement: ${googleDocsError.message}`);
      }
    }
  } catch (error) {
    console.error('💥 PDF generation completely failed:', error.message);
    throw error;
  }
};
