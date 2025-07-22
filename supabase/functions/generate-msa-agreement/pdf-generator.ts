
import { generateMSAPDF, getGoogleAccessToken } from './google-docs-simplified.ts';
import { createMSAPlaceholders } from './placeholders.ts';

export const generateAgreementPDF = async (msaData: any, templateDocId: string): Promise<ArrayBuffer> => {
  if (!templateDocId) {
    throw new Error('Template document ID is required. Please configure DEFAULT_GOOGLE_DOC_ID in your environment secrets.');
  }

  console.log('🔄 Starting simplified MSA PDF generation for:', msaData.first_name, msaData.last_name);
  console.log('📋 Template document ID:', templateDocId);
  
  try {
    // Get access token once at the beginning
    console.log('🔑 Authenticating with Google...');
    const accessToken = await getGoogleAccessToken();
    console.log('✅ Google authentication successful');
    
    // Prepare placeholder replacements
    const placeholders = createMSAPlaceholders(msaData);
    console.log('📝 Prepared placeholders:', Object.keys(placeholders));
    
    // Generate PDF using simplified workflow
    const pdfBuffer = await generateMSAPDF(accessToken, templateDocId, placeholders);
    
    console.log('✅ MSA PDF generated successfully, size:', pdfBuffer.byteLength);
    return pdfBuffer.buffer;
    
  } catch (error) {
    console.error('💥 Error in generateAgreementPDF:', error);
    
    // Provide specific error guidance
    if (error.message.includes('storage quota')) {
      throw new Error('Google Drive storage quota exceeded. Please free up space in your Google Drive account or upgrade your storage plan to continue generating MSA agreements.');
    } else if (error.message.includes('permission') || error.message.includes('access')) {
      throw new Error('Google Docs access denied. Please ensure the template document is shared with the service account email with Editor permissions.');
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      throw new Error('Google Docs template not found. Please verify the template document ID is correct and the document exists.');
    } else if (error.message.includes('authentication') || error.message.includes('401')) {
      throw new Error('Google authentication failed. Please check the GOOGLE_SERVICE_ACCOUNT_KEY configuration.');
    } else if (error.message.includes('Template document ID is required')) {
      throw new Error('Template document ID is required. Please configure DEFAULT_GOOGLE_DOC_ID in your environment secrets.');
    }
    
    throw new Error(`Failed to generate MSA agreement: ${error.message}`);
  }
};
