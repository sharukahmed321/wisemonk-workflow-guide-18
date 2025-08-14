
import * as z from 'zod';

// Constants for dropdowns
export const EMPLOYEE_COUNTS = ['1-10', '11-50', '51-200', '201-500', '500+'];
export const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Singapore', 'Other'];

// Helper functions
export const sanitizeInput = (input: string) => {
  return input.trim().replace(/\s+/g, ' ');
};

export const numericOnly = (input: string) => {
  return input.replace(/\D/g, '');
};

// Validator functions
export const createNameValidator = (fieldName: string, minLength: number = 2, maxLength: number = 50) => {
  return z.string()
    .min(1, 'This field is required')
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .transform(val => sanitizeInput(val))
    .refine(val => val.length >= minLength, `Must be at least ${minLength} characters after trimming`);
};

export const createJobTitleValidator = (maxLength: number = 100) => {
  return z.string()
    .min(1, 'This field is required')
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .transform(val => sanitizeInput(val));
};

export const createBusinessNameValidator = (fieldName: string, maxLength: number = 100) => {
  return z.string()
    .min(1, 'This field is required')
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .transform(val => sanitizeInput(val));
};

export const createJobDescriptionValidator = (maxLength: number = 1000) => {
  return z.string()
    .min(1, 'This field is required')
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .transform(val => sanitizeInput(val));
};

export const createPhoneValidator = () => {
  return z.string()
    .min(1, 'This field is required')
    .min(10, 'Phone number must be at least 10 digits')
    .transform(val => numericOnly(val))
    .refine(val => val.length >= 10, 'Phone number must be at least 10 digits');
};

export const createAddressValidator = (fieldName: string, maxLength: number = 200) => {
  return z.string()
    .min(1, 'This field is required')
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .transform(val => sanitizeInput(val));
};

export const createCityValidator = (minLength: number = 2, maxLength: number = 100) => {
  return z.string()
    .min(1, 'This field is required')
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .transform(val => sanitizeInput(val));
};

export const createStateValidator = (maxLength: number = 100) => {
  return z.string()
    .min(1, 'This field is required')
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .transform(val => sanitizeInput(val));
};

export const createPostalCodeValidator = (country: string = 'us') => {
  return z.string()
    .min(1, 'This field is required')
    .transform(val => numericOnly(val))
    .refine(val => {
      if (country === 'india') {
        return val.length === 6;
      }
      return val.length >= 3 && val.length <= 10;
    }, country === 'india' ? 'Must be exactly 6 digits' : 'Must be between 3-10 digits');
};

export const createDateOfBirthValidator = () => {
  return z.date({
    required_error: 'This field is required',
    invalid_type_error: 'Please select a valid date',
  })
  .refine(date => {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    return age >= 16 && age <= 100;
  }, 'Age must be between 16 and 100 years');
};

export const createDropdownValidator = (fieldName: string, options: string[]) => {
  return z.string()
    .min(1, 'This field is required')
    .refine(val => options.includes(val), 'Please select a valid option');
};

export const createSalaryValidator = (maxSalary: number = 500000) => {
  return z.number()
    .min(1, 'This field is required')
    .max(maxSalary, `Salary cannot exceed ${maxSalary.toLocaleString()}`)
    .positive('Salary must be a positive number');
};

// Schema creation functions
export const createPersonalDetailsSchema = () => {
  return z.object({
    firstName: z.string().min(1, 'This field is required'),
    lastName: z.string().min(1, 'This field is required'),
    middleName: z.string().optional(),
    dateOfBirth: z.string().min(1, 'This field is required'),
    fatherName: z.string().min(1, 'This field is required'),
    gender: z.enum(['male', 'female', 'other'], {
      message: 'This field is required',
    }),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed'], {
      message: 'This field is required',
    }),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
      message: 'This field is required',
    }),
    phoneNumber: z.string().min(1, 'This field is required'),
    email: z.string().min(1, 'This field is required').email('Please enter a valid email address'),
    alternatePhoneNumber: z.string().optional(),
    emergencyContactName: z.string().min(1, 'This field is required'),
    emergencyContactRelationship: z.string().min(1, 'This field is required'),
    emergencyContactPhone: z.string().min(1, 'This field is required'),
    
    // Address fields
    currentAddress: z.string().min(1, 'This field is required'),
    currentCity: z.string().min(1, 'This field is required'),
    currentState: z.string().min(1, 'This field is required'),
    currentPincode: z.string().min(1, 'This field is required'),
    currentCountry: z.string().min(1, 'This field is required'),
    
    permanentAddress: z.string().min(1, 'This field is required'),
    permanentCity: z.string().min(1, 'This field is required'),
    permanentState: z.string().min(1, 'This field is required'),
    permanentPincode: z.string().min(1, 'This field is required'),
    permanentCountry: z.string().min(1, 'This field is required'),
    
    // Document fields
    panCard: z.string().min(1, 'This field is required'),
    aadharCard: z.string().min(1, 'This field is required'),
    
    // Job details
    designation: z.string().min(1, 'This field is required'),
    department: z.string().min(1, 'This field is required'),
    dateOfJoining: z.string().min(1, 'This field is required'),
    employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship'], {
      message: 'This field is required',
    }),
    workLocation: z.string().min(1, 'This field is required'),
    reportingManager: z.string().min(1, 'This field is required'),
  });
};

export const createJobDetailsSchema = () => {
  return z.object({
    designation: z.string().min(1, 'This field is required'),
    department: z.string().min(1, 'This field is required'),
    dateOfJoining: z.string().min(1, 'This field is required'),
    employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship'], {
      message: 'This field is required',
    }),
    workLocation: z.string().min(1, 'This field is required'),
    reportingManager: z.string().min(1, 'This field is required'),
    probationPeriod: z.string().optional(),
    workingHours: z.string().optional(),
    salaryStructure: z.string().optional(),
  });
};

export const validatePersonalDetails = (data: any) => {
  const schema = createPersonalDetailsSchema();
  return schema.safeParse(data);
};

export const validateJobDetails = (data: any) => {
  const schema = createJobDetailsSchema();
  return schema.safeParse(data);
};
