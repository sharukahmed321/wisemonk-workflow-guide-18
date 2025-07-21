
import { formatDate, formatAddress } from './formatters.ts';

export const createMSAPlaceholders = (msaData: any) => {
  const fullAddress = formatAddress(
    msaData.business_address,
    msaData.business_city,
    msaData.business_state,
    msaData.business_postal_code
  );

  return {
    '{{Client_name_address}}': `${msaData.legal_name || 'N/A'}, ${fullAddress}`,
    '{{Agreement_date}}': msaData.currentDate ? formatDate(msaData.currentDate) : formatDate(new Date().toISOString()),
    '{{Client}}': msaData.legal_name || 'N/A',
    '{{Name}}': `${msaData.first_name || ''} ${msaData.last_name || ''}`.trim() || 'N/A',
    '{{Designation}}': msaData.job_title || 'N/A'
  };
};

export const replaceMSAPlaceholders = (template: string, msaData: any): string => {
  const placeholders = createMSAPlaceholders(msaData);
  let processedTemplate = template;
  
  // Replace all placeholders
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    // Escape special regex characters in placeholder
    const escapedPlaceholder = placeholder.replace(/[{}]/g, '\\$&');
    processedTemplate = processedTemplate.replace(
      new RegExp(escapedPlaceholder, 'g'), 
      value || ''
    );
  });
  
  // Clean up any remaining empty placeholder patterns
  processedTemplate = processedTemplate.replace(/\{\{[^}]+\}\}/g, '');
  
  // Clean up excessive empty lines but preserve intentional spacing
  processedTemplate = processedTemplate.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Clean up trailing whitespace from lines
  processedTemplate = processedTemplate.replace(/[ \t]+$/gm, '');
  
  return processedTemplate;
};

// Default hardcoded template fallback
export const getDefaultMSATemplate = (): string => {
  return `Master Service AGREEMENT

Organisation INFORMATION:
Client: {{Client}}
Address: {{Client_name_address}}
Agreement Date: {{Agreement_date}}

MSA DETAILS:
This Master Service Agreement ("Agreement") is entered into between {{Client}} and {{Name}}, {{Designation}}.

TERMS AND CONDITIONS:
1. This agreement governs the provision of HR management services
2. Both parties agree to maintain confidentiality of business information
3. Service availability and support commitments as outlined in the platform
4. Data protection and privacy guarantees in accordance with applicable laws
5. Payment terms and billing cycles as specified in the service package
6. Either party may terminate this agreement with 30 days written notice

SIGNATURES:
By signing below, both parties acknowledge they have read and agree to the terms of this agreement.

Client Representative: {{Name}}
Title: {{Designation}}
Date: {{Agreement_date}}

Wisemonk Representative: ____________________
Date: {{Agreement_date}}`;
};
