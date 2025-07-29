import * as z from 'zod';

// XSS and injection prevention
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Character type validators
export const alphabeticalOnly = (value: string): boolean => {
  return /^[A-Za-z\s\-']+$/.test(value);
};

export const alphabeticalWithHyphens = (value: string): boolean => {
  return /^[A-Za-z\s\-']+$/.test(value);
};

export const alphanumericWithSpaces = (value: string): boolean => {
  return /^[A-Za-z0-9\s\-'.&]+$/.test(value);
};

export const businessNameAllowed = (value: string): boolean => {
  return /^[A-Za-z0-9\s\-'.&,()]+$/.test(value);
};

export const addressAllowed = (value: string): boolean => {
  return /^[A-Za-z0-9\s\-'.,#/()]+$/.test(value);
};

export const internationalCityName = (value: string): boolean => {
  return /^[A-Za-z\u00C0-\u017F\s\-'.]+$/.test(value);
};

export const numericOnly = (value: string): boolean => {
  return /^\d+$/.test(value);
};

export const alphanumericPostal = (value: string): boolean => {
  return /^[A-Za-z0-9\s\-]+$/.test(value);
};

// Whitespace validators
export const notOnlyWhitespace = (value: string): boolean => {
  return value.trim().length > 0;
};

// Country-specific postal code validation
export const validatePostalCode = (code: string, country?: string): boolean => {
  if (!code || !notOnlyWhitespace(code)) return false;
  
  const trimmedCode = code.trim();
  
  switch (country?.toLowerCase()) {
    case 'united states':
    case 'usa':
      return /^\d{5}(-\d{4})?$/.test(trimmedCode);
    case 'canada':
      return /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(trimmedCode);
    case 'united kingdom':
    case 'uk':
      return /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/.test(trimmedCode);
    case 'germany':
      return /^\d{5}$/.test(trimmedCode);
    case 'france':
      return /^\d{5}$/.test(trimmedCode);
    case 'australia':
      return /^\d{4}$/.test(trimmedCode);
    case 'india':
      return /^\d{6}$/.test(trimmedCode);
    case 'japan':
      return /^\d{3}-\d{4}$/.test(trimmedCode);
    default:
      return alphanumericPostal(trimmedCode);
  }
};

// Enhanced Zod validation schemas
export const createNameValidator = (fieldName: string, minLength: number = 2, maxLength: number = 50) => {
  return z.string()
    .min(1, `${fieldName} is required`)
    .refine(notOnlyWhitespace, `${fieldName} cannot be only whitespace`)
    .transform(sanitizeInput)
    .refine(alphabeticalWithHyphens, `${fieldName} must contain only letters, spaces, and hyphens`)
    .refine(val => val.length >= minLength, `${fieldName} must be at least ${minLength} characters`)
    .refine(val => val.length <= maxLength, `${fieldName} must be no more than ${maxLength} characters`);
};

export const createJobTitleValidator = (maxLength: number = 100) => {
  return z.string()
    .min(1, 'Job title is required')
    .refine(notOnlyWhitespace, 'Job title cannot be only whitespace')
    .transform(sanitizeInput)
    .refine(alphanumericWithSpaces, 'Job title contains invalid characters')
    .refine(val => val.length <= maxLength, `Job title must be no more than ${maxLength} characters`);
};

export const createBusinessNameValidator = (fieldName: string, maxLength: number = 100) => {
  return z.string()
    .min(1, `${fieldName} is required`)
    .refine(notOnlyWhitespace, `${fieldName} cannot be only whitespace`)
    .transform(sanitizeInput)
    .refine(businessNameAllowed, `${fieldName} contains invalid characters`)
    .refine(val => val.length <= maxLength, `${fieldName} must be no more than ${maxLength} characters`);
};

export const createAddressValidator = (fieldName: string, maxLength: number = 200) => {
  return z.string()
    .min(1, `${fieldName} is required`)
    .refine(notOnlyWhitespace, `${fieldName} cannot be only whitespace`)
    .transform(sanitizeInput)
    .refine(addressAllowed, `${fieldName} contains invalid characters`)
    .refine(val => val.length <= maxLength, `${fieldName} must be no more than ${maxLength} characters`);
};

export const createCityValidator = (minLength: number = 2, maxLength: number = 100) => {
  return z.string()
    .min(1, 'City is required')
    .refine(notOnlyWhitespace, 'City cannot be only whitespace')
    .transform(sanitizeInput)
    .refine(internationalCityName, 'City name contains invalid characters')
    .refine(val => val.length >= minLength, `City must be at least ${minLength} characters`)
    .refine(val => val.length <= maxLength, `City must be no more than ${maxLength} characters`);
};

export const createStateValidator = (maxLength: number = 100) => {
  return z.string()
    .min(1, 'State/Province is required')
    .refine(notOnlyWhitespace, 'State/Province cannot be only whitespace')
    .transform(sanitizeInput)
    .refine(alphabeticalOnly, 'State/Province must contain only letters and spaces')
    .refine(val => val.length <= maxLength, `State/Province must be no more than ${maxLength} characters`);
};

export const createPostalCodeValidator = (country?: string) => {
  return z.string()
    .min(1, 'Postal code is required')
    .refine(notOnlyWhitespace, 'Postal code cannot be only whitespace')
    .transform(val => val.trim())
    .refine(val => validatePostalCode(val, country), 'Invalid postal code format');
};

export const createDropdownValidator = (fieldName: string, allowedValues?: string[]) => {
  return z.string()
    .min(1, `Please select ${fieldName}`)
    .refine(val => !allowedValues || allowedValues.length === 0 || allowedValues.includes(val), `Invalid ${fieldName} selection`);
};

// Complete country list
export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
  'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada',
  'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti',
  'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
  'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
  'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
  'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',
  'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa',
  'San Marino', 'São Tomé and Príncipe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand',
  'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe'
];

// Employee count ranges
export const EMPLOYEE_COUNTS = [
  '1-10',
  '11-50', 
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+'
];