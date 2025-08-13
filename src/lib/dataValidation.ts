/**
 * Enhanced data validation utilities for sensitive information
 * Includes security-focused validation for PII and financial data
 */

/**
 * Validates Indian Aadhaar number format (12 digits only)
 */
export function validateAadhaarNumber(aadhaar: string): { isValid: boolean; error?: string } {
  // Remove spaces and hyphens
  const cleanAadhaar = aadhaar.replace(/[\s-]/g, '');
  
  // Basic format check
  if (!/^\d{12}$/.test(cleanAadhaar)) {
    return { isValid: false, error: 'Aadhaar number must be 12 digits' };
  }

  return { isValid: true };
}

/**
 * Validates IFSC code format for Indian banks
 */
export function validateIFSCCode(ifsc: string): { isValid: boolean; error?: string } {
  const cleanIFSC = ifsc.toUpperCase().trim();
  
  // IFSC format: 4 letters (bank code) + 0 + 6 alphanumeric (branch code)
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIFSC)) {
    return { 
      isValid: false, 
      error: 'IFSC code must be in format: ABCD0123456 (4 letters, 0, 6 alphanumeric)' 
    };
  }

  return { isValid: true };
}

/**
 * Validates Indian bank account number
 */
export function validateBankAccountNumber(accountNumber: string): { isValid: boolean; error?: string } {
  const cleanAccount = accountNumber.replace(/[\s-]/g, '');
  
  // Basic format check: 9-18 digits
  if (!/^\d{9,18}$/.test(cleanAccount)) {
    return { 
      isValid: false, 
      error: 'Bank account number must be 9-18 digits' 
    };
  }

  return { isValid: true };
}

/**
 * Validates PAN (Permanent Account Number) format
 */
export function validatePANNumber(pan: string): { isValid: boolean; error?: string } {
  const cleanPAN = pan.toUpperCase().trim();
  
  // PAN format: 5 letters + 4 digits + 1 letter
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPAN)) {
    return { 
      isValid: false, 
      error: 'PAN must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter)' 
    };
  }

  return { isValid: true };
}

/**
 * Validates UAN (Universal Account Number) format
 */
export function validateUANNumber(uan: string): { isValid: boolean; error?: string } {
  const cleanUAN = uan.replace(/[\s-]/g, '');
  
  // UAN format: 12 digits
  if (!/^\d{12}$/.test(cleanUAN)) {
    return { 
      isValid: false, 
      error: 'UAN must be 12 digits' 
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes sensitive data for logging (replaces with asterisks)
 */
export function sanitizeForLogging(data: string, visibleChars: number = 4): string {
  if (!data || data.length <= visibleChars) {
    return '*'.repeat(data?.length || 0);
  }
  
  const start = data.substring(0, visibleChars / 2);
  const end = data.substring(data.length - visibleChars / 2);
  const middle = '*'.repeat(data.length - visibleChars);
  
  return start + middle + end;
}

/**
 * Validates file upload for security
 */
export function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  // Maximum file size: 10MB
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }

  // Allowed file types for documents
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'File type not allowed. Please upload PDF, JPG, PNG, WEBP, DOC, or DOCX files only.' 
    };
  }

  // Check file name for suspicious patterns
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.sh$/i,
    /\.scr$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.php$/i,
    /\.\./,  // Path traversal
    /[<>:"|?*]/  // Invalid filename characters
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      return { isValid: false, error: 'Invalid file name or type detected' };
    }
  }

  return { isValid: true };
}

/**
 * Validates email domain against common disposable email providers
 */
export function validateEmailDomain(email: string): { isValid: boolean; error?: string } {
  // Common disposable email domains to block
  const disposableDomains = [
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'tempmail.org',
    'throwaway.email',
    'yopmail.com'
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  
  if (disposableDomains.includes(domain)) {
    return { 
      isValid: false, 
      error: 'Please use a valid business or personal email address' 
    };
  }

  return { isValid: true };
}

/**
 * Enhanced password strength validation
 */
export function validatePasswordStrength(password: string): { 
  isValid: boolean; 
  score: number; 
  suggestions: string[];
  error?: string;
} {
  const suggestions: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score += 1;
  else suggestions.push('Consider using 12 or more characters');

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  else suggestions.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else suggestions.push('Include uppercase letters');

  if (/\d/.test(password)) score += 1;
  else suggestions.push('Include numbers');

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else suggestions.push('Include special characters');

  // Common patterns to avoid
  const commonPatterns = [
    /(.)\1{2,}/,  // Repeated characters
    /123|456|789|abc|qwe/i,  // Sequential patterns
    /password|admin|user/i  // Common words
  ];

  let hasCommonPattern = false;
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      hasCommonPattern = true;
      suggestions.push('Avoid common patterns and repeated characters');
      break;
    }
  }

  if (!hasCommonPattern) score += 1;

  const isValid = score >= 4 && password.length >= 8;

  return {
    isValid,
    score,
    suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
    error: isValid ? undefined : 'Password does not meet security requirements'
  };
}