
export type EmployeeStatus = 'Active' | 'Onboarding' | 'Preboarding' | 'Exit';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
export type Department = 'Engineering' | 'Marketing' | 'Sales' | 'HR' | 'Finance' | 'Operations' | 'Design';
export type UserRole = 'admin' | 'employee';
export type BGVStatus = 'pending' | 'in-progress' | 'completed' | 'failed';
export type AgreementStatus = 'pending' | 'sent' | 'signed';
export type DocumentType = 'aadhaar' | 'pan' | 'offer-letter' | 'passport' | 'driving-license';

export interface DocumentStatus {
  type: DocumentType;
  uploaded: boolean;
  verified: boolean;
  uploadedAt?: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface PreboardingStatus {
  employmentLetterSent: boolean;
  employmentLetterSentAt?: Date;
  documentsRequired: DocumentStatus[];
  bgvStatus: BGVStatus;
  agreementStatus: AgreementStatus;
  overallProgress: number; // 0-100
  createdAt: Date;
  expectedCompletionDate: Date;
}

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
  birthday?: string;
  preboarding?: PreboardingStatus;
}

export interface UserPermissions {
  role: UserRole;
  employeeId?: string;
  canViewAllEmployees: boolean;
  canEditAllEmployees: boolean;
  canApproveDocuments: boolean;
  canManageDocuments: boolean;
}

// Employee Details Step
export interface EmployeeDetailsData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  seniority: string;
  startDate: Date;
  workLocation: string;
  jobDescription?: string;
}

// Compensation Step
export interface CompensationReviewData {
  salary: number;
  currency: string;
  agreementAccepted: boolean;
}

export interface CompleteEmployeeData extends EmployeeDetailsData, CompensationReviewData {}
