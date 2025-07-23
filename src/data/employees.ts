
import { Employee } from '@/types/employee';

export const mockEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+1-555-0123',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    employmentType: 'Full-time',
    salary: 85000,
    startDate: '2023-01-15',
    status: 'Active',
    avatar: '/api/placeholder/32/32'
  },
  {
    id: '2',
    employeeId: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@company.com',
    phone: '+1-555-0124',
    jobTitle: 'Product Manager',
    department: 'Marketing',
    employmentType: 'Full-time',
    salary: 95000,
    startDate: '2023-02-01',
    status: 'Active',
    avatar: '/api/placeholder/32/32'
  },
  {
    id: '3',
    employeeId: 'EMP003',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@company.com',
    phone: '+1-555-0125',
    jobTitle: 'UX Designer',
    department: 'Design',
    employmentType: 'Contract',
    salary: 75000,
    startDate: '2023-03-01',
    status: 'Onboarding',
    avatar: '/api/placeholder/32/32'
  }
];

export const mockPreboardingEmployees: Employee[] = [
  {
    id: '4',
    employeeId: 'EMP004',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@company.com',
    phone: '+1-555-0126',
    jobTitle: 'Marketing Specialist',
    department: 'Marketing',
    employmentType: 'Full-time',
    salary: 65000,
    startDate: '2023-04-01',
    status: 'Preboarding',
    avatar: '/api/placeholder/32/32',
    preboarding: {
      employmentLetterSent: true,
      employmentLetterSentAt: new Date('2023-03-15'),
      documentsRequired: [
        { type: 'aadhaar', uploaded: true, verified: true, uploadedAt: new Date('2023-03-16') },
        { type: 'pan', uploaded: true, verified: false, uploadedAt: new Date('2023-03-17') },
        { type: 'passport', uploaded: false, verified: false }
      ],
      bgvStatus: 'in-progress',
      agreementStatus: 'signed',
      overallProgress: 75,
      createdAt: new Date('2023-03-15'),
      expectedCompletionDate: new Date('2023-03-30')
    }
  },
  {
    id: '5',
    employeeId: 'EMP005',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@company.com',
    phone: '+1-555-0127',
    jobTitle: 'Data Analyst',
    department: 'Engineering',
    employmentType: 'Full-time',
    salary: 70000,
    startDate: '2023-04-15',
    status: 'Preboarding',
    avatar: '/api/placeholder/32/32',
    preboarding: {
      employmentLetterSent: true,
      employmentLetterSentAt: new Date('2023-03-20'),
      documentsRequired: [
        { type: 'aadhaar', uploaded: false, verified: false },
        { type: 'pan', uploaded: false, verified: false },
        { type: 'offer-letter', uploaded: false, verified: false }
      ],
      bgvStatus: 'pending',
      agreementStatus: 'pending',
      overallProgress: 25,
      createdAt: new Date('2023-03-20'),
      expectedCompletionDate: new Date('2023-04-10')
    }
  }
];
