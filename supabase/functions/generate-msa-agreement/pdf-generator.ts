
import { generateMSAPDFEnhanced } from './google-docs-enhanced.ts';
import { generateFallbackMSAPDF } from './fallback-generator.ts';
import { createMSAPlaceholders } from './placeholders.ts';

export const generateAgreementPDF = async (msaData: any, templateDocId: string): Promise<ArrayBuffer> => {
  if (!templateDocId) {
    throw new Error('Template document ID is required. Please configure DEFAULT_GOOGLE_DOC_ID in your environment secrets.');
  }

  console.log('🔄 Starting enhanced MSA PDF generation for:', msaData.first_name, msaData.last_name);
  console.log('📋 Template document ID:', templateDocId);
  
  try {
    // Prepare placeholder replacements
    const placeholders = createMSAPlaceholders(msaData);
    console.log('📝 Prepared placeholders:', Object.keys(placeholders));
    
    // Try enhanced Google Docs workflow first
    console.log('🔄 Attempting enhanced Google Docs workflow...');
    const pdfBuffer = await generateMSAPDFEnhanced(templateDocId, placeholders, msaData);
    
    console.log('✅ MSA PDF generated successfully with enhanced Google Docs workflow, size:', pdfBuffer.byteLength);
    return pdfBuffer.buffer;
    
  } catch (googleDocsError) {
    console.error('💥 Enhanced Google Docs workflow failed:', googleDocsError.message);
    
    // Check if this is a storage quota issue
    if (googleDocsError.message.includes('storage quota') || 
        googleDocsError.message.includes('storageQuotaExceeded')) {
      
      console.log('🔄 Falling back to HTML-to-PDF generation due to storage quota issue...');
      
      try {
        const fallbackPdfBuffer = await generateFallbackMSAPDF(msaData);
        console.log('✅ MSA PDF generated successfully with fallback method, size:', fallbackPdfBuffer.byteLength);
        return fallbackPdfBuffer.buffer;
        
      } catch (fallbackError) {
        console.error('💥 Fallback PDF generation also failed:', fallbackError.message);
        throw new Error(`Both Google Docs and fallback PDF generation failed. Google Docs error: ${googleDocsError.message}. Fallback error: ${fallbackError.message}`);
      }
      
    } else {
      // For non-storage issues, provide specific error guidance
      if (googleDocsError.message.includes('permission') || googleDocsError.message.includes('access')) {
        throw new Error('Google Docs access denied. Please ensure the template document is shared with the service account email with Editor permissions.');
      } else if (googleDocsError.message.includes('not found') || googleDocsError.message.includes('404')) {
        throw new Error('Google Docs template not found. Please verify the template document ID is correct and the document exists.');
      } else if (googleDocsError.message.includes('authentication') || googleDocsError.message.includes('401')) {
        throw new Error('Google authentication failed. Please check the GOOGLE_SERVICE_ACCOUNT_KEY configuration.');
      } else if (googleDocsError.message.includes('Rate limited') || googleDocsError.message.includes('429')) {
        throw new Error('Google API rate limit exceeded. Please try again in a few moments.');
      }
      
      throw new Error(`Failed to generate MSA agreement: ${googleDocsError.message}`);
    }
  }
};
