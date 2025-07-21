
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { replaceMSAPlaceholders, getDefaultMSATemplate } from './placeholders.ts';
import { createDocumentCopy, replacePlaceholdersInDoc, exportDocAsPDF, deleteDocument } from './google-docs.ts';

export const generatePDF = (content: string, msaData: any): ArrayBuffer => {
  console.log('Generating PDF for msaData:', msaData.first_name, msaData.last_name);
  const doc = new jsPDF();
  
  // PDF settings
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let yPosition = margin;
  const normalFontSize = 11;
  const headerFontSize = 14;
  const titleFontSize = 16;
  const normalLineHeight = 6;
  const headerLineHeight = 8;
  const titleLineHeight = 10;
  const sectionSpacing = 10;
  const paragraphSpacing = 4;
  
  // Split content into lines
  const lines = content.split('\n');
  
  const addNewPageIfNeeded = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      console.log('Added new page, reset yPosition to:', yPosition);
    }
  };
  
  const addText = (text: string, fontSize = normalFontSize, fontStyle = 'normal', lineHeight = normalLineHeight, addSpacing = false) => {
    if (!text.trim()) {
      yPosition += lineHeight / 2;
      return;
    }
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    const splitText = doc.splitTextToSize(text, maxWidth);
    const requiredHeight = splitText.length * lineHeight + (addSpacing ? sectionSpacing : 0);
    
    addNewPageIfNeeded(requiredHeight);
    
    splitText.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
    
    if (addSpacing) {
      yPosition += sectionSpacing - lineHeight;
    }
  };
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      yPosition += normalLineHeight / 2;
      return;
    }
    
    // Main title
    if (trimmedLine.includes('Master Service AGREEMENT')) {
      if (index > 0) yPosition += sectionSpacing;
      addText(trimmedLine, titleFontSize, 'bold', titleLineHeight, true);
    } else if (trimmedLine.includes('Organisation INFORMATION:') || 
               trimmedLine.includes('MSA DETAILS:') || 
               trimmedLine.includes('TERMS AND CONDITIONS:') || 
               trimmedLine.includes('SIGNATURES:')) {
      yPosition += sectionSpacing / 2;
      addText(trimmedLine, headerFontSize, 'bold', headerLineHeight, false);
      yPosition += paragraphSpacing;
    } else if (trimmedLine.match(/^\d+\./)) {
      addText(trimmedLine, normalFontSize, 'normal', normalLineHeight, false);
      yPosition += paragraphSpacing;
    } else if (trimmedLine.startsWith('•')) {
      addText(trimmedLine, normalFontSize, 'normal', normalLineHeight, false);
      yPosition += 2;
    } else {
      addText(trimmedLine, normalFontSize, 'normal', normalLineHeight, false);
      yPosition += 1;
    }
  });
  
  console.log('PDF generation completed, final yPosition:', yPosition);
  return doc.output('arraybuffer');
};

export const generateAgreementPDF = async (msaData: any, templateDocId?: string): Promise<ArrayBuffer> => {
  console.log('Starting PDF generation for msaData:', msaData.first_name, msaData.last_name);
  console.log('Template Doc ID:', templateDocId);
  
  try {
    // Always try Google Docs workflow first when we have a template ID
    if (templateDocId) {
      console.log('🔄 Using Google Docs template workflow');
      console.log('📋 Template ID:', templateDocId);
      
      try {
        // Create a copy of the template document
        const tempDocTitle = `WM-${msaData.name}_MSA_${Date.now()}`;
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
        console.log('✅ PDF exported successfully from Google Docs, size:', pdfBuffer.byteLength);
        
        // Clean up: delete the temporary document
        console.log('🗑️ Cleaning up temporary document...');
        await deleteDocument(tempDocId);
        console.log('✅ Temporary document deleted successfully');
        
        return pdfBuffer;
      } catch (googleDocsError) {
        console.error('❌ Google Docs workflow failed with error:', googleDocsError.message);
        console.error('Error details:', googleDocsError);
        
        // Provide specific error guidance
        if (googleDocsError.message.includes('permission') || googleDocsError.message.includes('access')) {
          console.error('🔧 PERMISSION ERROR: The Google Service Account may not have access to the template document');
          console.error('   Solution: Share the Google Docs template with the service account email');
        } else if (googleDocsError.message.includes('not found') || googleDocsError.message.includes('404')) {
          console.error('🔧 DOCUMENT NOT FOUND: The template document ID may be incorrect');
          console.error('   Solution: Verify the DEFAULT_GOOGLE_DOC_ID or custom template ID is correct');
        } else if (googleDocsError.message.includes('authentication') || googleDocsError.message.includes('401')) {
          console.error('🔧 AUTHENTICATION ERROR: Google Service Account credentials may be invalid');
          console.error('   Solution: Check GOOGLE_SERVICE_ACCOUNT_KEY secret configuration');
        }
        
        console.log('⚠️ Falling back to hardcoded template due to Google Docs error');
        // Fall through to default template workflow
      }
    } else {
      console.log('ℹ️ No template document ID provided, using hardcoded template');
    }
    
    // Fallback: Use default hardcoded template workflow
    const defaultTemplate = getDefaultMSATemplate();
    const processedContent = replaceMSAPlaceholders(defaultTemplate, msaData);
    console.log('✅ Placeholders replaced in hardcoded template');
    
    // Generate PDF from the processed content
    const pdfBuffer = generatePDF(processedContent, msaData);
    console.log('✅ PDF generated from hardcoded template, size:', pdfBuffer.byteLength);
    
    return pdfBuffer;
  } catch (error) {
    console.error('💥 Error in generateAgreementPDF:', error);
    throw new Error(`Failed to generate agreement PDF: ${error.message}`);
  }
};
