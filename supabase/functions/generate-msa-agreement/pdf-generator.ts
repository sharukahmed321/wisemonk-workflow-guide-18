
import { createDocumentCopy, replacePlaceholdersInDoc, exportDocAsPDF, deleteDocument } from './google-docs.ts';

export const generateAgreementPDF = async (msaData: any, templateDocId: string): Promise<ArrayBuffer> => {
  if (!templateDocId) {
    throw new Error('Template document ID is required. Please configure DEFAULT_GOOGLE_DOC_ID in your environment secrets.');
  }

  console.log('🔄 Starting Google Docs PDF generation for:', msaData.first_name, msaData.last_name);
  console.log('📋 Template document ID:', templateDocId);
  
  try {
    // Create a copy of the template document
    const tempDocTitle = `MSA_${msaData.name}_${Date.now()}`;
    console.log('📄 Creating temporary document copy with title:', tempDocTitle);
    const tempDocId = await createDocumentCopy(templateDocId, tempDocTitle);
    console.log('✅ Created temporary document copy with ID:', tempDocId);
    
    // Replace placeholders in the temporary document
    console.log('🔄 Replacing placeholders in temporary document...');
    await replacePlaceholdersInDoc(tempDocId, msaData);
    console.log('✅ Placeholders replaced successfully');
    
    // Export the document as PDF
    console.log('📄 Exporting document as PDF...');
    const pdfBuffer = await exportDocAsPDF(tempDocId);
    console.log('✅ PDF exported successfully, size:', pdfBuffer.byteLength);
    
    // Clean up: delete the temporary document
    console.log('🗑️ Cleaning up temporary document...');
    await deleteDocument(tempDocId);
    console.log('✅ Temporary document deleted successfully');
    
    return pdfBuffer;
  } catch (error) {
    console.error('💥 Error in generateAgreementPDF:', error);
    
    // Provide specific error guidance
    if (error.message.includes('permission') || error.message.includes('access')) {
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
