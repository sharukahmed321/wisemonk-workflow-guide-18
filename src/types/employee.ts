export type EmployeeStatus = 'Active' | 'Onboarding' | 'Preboarding';
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
