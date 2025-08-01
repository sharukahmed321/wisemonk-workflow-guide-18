
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
  // Preboarding-specific fields
  joiningDate?: string;
  preboardingStatus?: PreboardingStatus;
}

export interface PreboardingData {
  personalDetails: {
    fullName: string;
    fatherName: string;
    dateOfBirth: Date;
    aadhaarNumber: string;
  };
  backgroundVerification: {
    documents: {
      panCard?: File;
      previousPayslips?: File;
      previousOfferLetter?: File;
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
