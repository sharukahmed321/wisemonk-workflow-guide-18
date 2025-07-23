
// Production-ready placeholder creation with formatters
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

// Consolidated formatters
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return '';
  }
};

export const formatAddress = (address: string, city: string, state: string, postalCode: string): string => {
  const parts = [address, city, state, postalCode].filter(part => part && part.trim());
  return parts.join(', ');
};
