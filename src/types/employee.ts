
export type EmployeeStatus = 'Active' | 'Onboarding' | 'Preboarding' | 'Invited';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
export type Department = 'Engineering' | 'Marketing' | 'Sales' | 'HR' | 'Finance' | 'Operations' | 'Design';
export type PreboardingStatus = 'Documents Pending' | 'Agreement Sent' | 'Completed';

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: Department;
  employmentType: EmploymentType;
  salary: number;
  startDate: string;
  status: EmployeeStatus;
  avatar?: string;
  birthday?: string; // MM-DD format
  age?: number; // Calculated from date_of_birth
  gender?: string; // "Son" or "Daughter"
  // Preboarding-specific fields
  joiningDate?: string;
  preboardingStatus?: PreboardingStatus;
  // Document URLs from preboarding
  panCardUrl?: string;
  previousPayslipsUrl?: string;
  previousOfferLetterUrl?: string;
}

export interface PreboardingData {
  personalDetails: {
    fullName: string;
    fatherName: string;
    dateOfBirth?: Date;
    aadhaarNumber: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  backgroundVerification: {
    documents: {
      panCard?: File;
      previousOfferLetter?: File;
    };
    payslips: {
      payslip1: { file?: File; fileName?: string; fileSize?: number; uploadedUrl?: string; status: 'pending' | 'uploading' | 'success' | 'error' };
      payslip2: { file?: File; fileName?: string; fileSize?: number; uploadedUrl?: string; status: 'pending' | 'uploading' | 'success' | 'error' };
      payslip3: { file?: File; fileName?: string; fileSize?: number; uploadedUrl?: string; status: 'pending' | 'uploading' | 'success' | 'error' };
    };
    uploadStatus: Record<string, 'pending' | 'uploading' | 'success' | 'error'>;
  };
  employmentAgreement: {
    agreedToTerms: boolean;
    digitalSignature?: string;
    signatureDate?: Date;
    completedAt?: Date;
  };
}

export interface PreboardingStep {
  number: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}
