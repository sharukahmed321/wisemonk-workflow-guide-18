
// Utility functions for salary formatting and conversion

export const sanitizeNumericInput = (input: string): string => {
  return input.replace(/[^\d]/g, '');
};

export const formatNumberWithCommas = (number: number): string => {
  return number.toLocaleString('en-IN');
};

export const convertNumberToWords = (number: number): string => {
  if (number === 0) return 'zero';
  
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  const convertHundreds = (num: number): string => {
    let result = '';
    
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' hundred ';
      num %= 100;
    }
    
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + ' ';
      return result.trim();
    }
    
    if (num > 0) {
      result += ones[num] + ' ';
    }
    
    return result.trim();
  };
  
  if (number >= 10000000) { // 1 crore
    const crores = Math.floor(number / 10000000);
    const remainder = number % 10000000;
    let result = convertHundreds(crores) + ' crore';
    if (remainder > 0) {
      result += ' ' + convertNumberToWords(remainder);
    }
    return result + ' rupees';
  }
  
  if (number >= 100000) { // 1 lakh
    const lakhs = Math.floor(number / 100000);
    const remainder = number % 100000;
    let result = convertHundreds(lakhs) + ' lakh';
    if (remainder > 0) {
      result += ' ' + convertNumberToWords(remainder);
    }
    return result + ' rupees';
  }
  
  if (number >= 1000) {
    const thousands = Math.floor(number / 1000);
    const remainder = number % 1000;
    let result = convertHundreds(thousands) + ' thousand';
    if (remainder > 0) {
      result += ' ' + convertHundreds(remainder);
    }
    return result + ' rupees';
  }
  
  return convertHundreds(number) + ' rupees';
};
