export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
  employmentType: string;
  salary: number;
  startDate: string;
  status: 'Active' | 'Onboarding' | 'Preboarding' | 'Exit';
  avatar?: string;
}

export const mockEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Senior Software Engineer',
    department: 'Engineering',
    employmentType: 'Full-time',
    salary: 120000,
    startDate: '2023-01-15',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '2',
    employeeId: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@company.com',
    phone: '+1 (555) 234-5678',
    jobTitle: 'Product Manager',
    department: 'Product',
    employmentType: 'Full-time',
    salary: 110000,
    startDate: '2023-03-20',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616c4b26e86?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '3',
    employeeId: 'EMP003',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@company.com',
    phone: '+1 (555) 345-6789',
    jobTitle: 'UX Designer',
    department: 'Design',
    employmentType: 'Full-time',
    salary: 95000,
    startDate: '2023-06-10',
    status: 'Onboarding',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '4',
    employeeId: 'EMP004',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@company.com',
    phone: '+1 (555) 456-7890',
    jobTitle: 'Marketing Specialist',
    department: 'Marketing',
    employmentType: 'Full-time',
    salary: 75000,
    startDate: '2023-09-01',
    status: 'Preboarding',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
  }
];