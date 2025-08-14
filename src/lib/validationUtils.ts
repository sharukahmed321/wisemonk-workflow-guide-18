
import * as z from 'zod';

export const createPersonalDetailsSchema = () => {
  return z.object({
    firstName: z.string().min(1, 'This field is required'),
    lastName: z.string().min(1, 'This field is required'),
    middleName: z.string().optional(),
    dateOfBirth: z.string().min(1, 'This field is required'),
    fatherName: z.string().min(1, 'This field is required'),
    gender: z.enum(['male', 'female', 'other'], {
      required_error: 'This field is required',
    }),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed'], {
      required_error: 'This field is required',
    }),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
      required_error: 'This field is required',
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
      required_error: 'This field is required',
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
      required_error: 'This field is required',
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
