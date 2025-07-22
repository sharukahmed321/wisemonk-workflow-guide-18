
import { generateMSAPDFOptimized } from './google-docs-optimized.ts';
import { createMSAPlaceholders } from './placeholders.ts';

export const generateAgreementPDF = async (msaData: any, templateDocId: string): Promise<ArrayBuffer> => {
  if (!templateDocId) {
    throw new Error('Template document ID is required. Please configure DEFAULT_GOOGLE_DOC_ID in your environment secrets.');
  }

  console.log('🔄 Starting optimized MSA PDF generation for:', msaData.first_name, msaData.last_name);
  console.log('📋 Template document ID:', templateDocId);
  
  try {
    // Prepare placeholder replacements
    const placeholders = createMSAPlaceholders(msaData);
    console.log('📝 Prepared placeholders:', Object.keys(placeholders));
    
    // Generate PDF using optimized workflow with token caching
    const pdfBuffer = await generateMSAPDFOptimized(templateDocId, placeholders);
    
    console.log('✅ MSA PDF generated successfully with optimized workflow, size:', pdfBuffer.byteLength);
    return pdfBuffer.buffer;
    
  } catch (error) {
    console.error('💥 Error in generateAgreementPDF:', error);
    
    // Provide specific error guidance with enhanced messaging
    if (error.message.includes('storage quota')) {
      throw new Error('Google Drive storage quota exceeded. The service account\'s Google Drive is full. Please either: 1) Clean up files in the Google Drive, 2) Create a new service account, or 3) Upgrade the Google Workspace storage plan.');
    } else if (error.message.includes('permission') || error.message.includes('access')) {
      throw new Error('Google Docs access denied. Please ensure the template document is shared with the service account email with Editor permissions.');
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      throw new Error('Google Docs template not found. Please verify the template document ID is correct and the document exists.');
    } else if (error.message.includes('authentication') || error.message.includes('401')) {
      throw new Error('Google authentication failed. Please check the GOOGLE_SERVICE_ACCOUNT_KEY configuration.');
    } else if (error.message.includes('Template document ID is required')) {
      throw new Error('Template document ID is required. Please configure DEFAULT_GOOGLE_DOC_ID in your environment secrets.');
    } else if (error.message.includes('Rate limited') || error.message.includes('429')) {
      throw new Error('Google API rate limit exceeded. Please try again in a few moments.');
    }
    
    throw new Error(`Failed to generate MSA agreement: ${error.message}`);
  }
};
