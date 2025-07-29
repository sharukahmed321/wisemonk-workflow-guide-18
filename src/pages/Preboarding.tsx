
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreboardingFlow } from '@/components/PreboardingFlow';
import { Employee } from '@/types/employee';

// Mock data - in real app, this would come from API
const mockEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 555 0123',
    jobTitle: 'Senior Frontend Developer',
    department: 'Engineering',
    employmentType: 'Full-time',
    salary: 85000,
    startDate: '2022-03-15',
    status: 'Active',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    firstName: 'Michael',
    lastName: 'Rodriguez',
    email: 'michael.rodriguez@company.com',
    phone: '+1 (555) 234-5678',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    employmentType: 'Full-time',
    salary: 75000,
    startDate: '2023-11-01',
    status: 'Onboarding',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    firstName: 'David',
    lastName: 'Thompson',
    email: 'david.thompson@company.com',
    phone: '+1 (555) 345-6789',
    jobTitle: 'Marketing Specialist',
    department: 'Marketing',
    employmentType: 'Full-time',
    salary: 60000,
    startDate: '2024-01-15',
    status: 'Preboarding',
    joiningDate: '2024-02-01',
    preboardingStatus: 'Documents Pending',
  },
  {
    id: '4',
    employeeId: 'EMP004',
    firstName: 'Emma',
    lastName: 'Wilson',
    email: 'emma.wilson@company.com',
    phone: '+1 (555) 456-7890',
    jobTitle: 'UX Designer',
    department: 'Design',
    employmentType: 'Full-time',
    salary: 70000,
    startDate: '2024-02-15',
    status: 'Preboarding',
    joiningDate: '2024-03-01',
    preboardingStatus: 'Agreement Sent',
  },
  {
    id: '5',
    employeeId: 'EMP005',
    firstName: 'James',
    lastName: 'Brown',
    email: 'james.brown@company.com',
    phone: '+1 (555) 567-8901',
    jobTitle: 'Product Manager',
    department: 'Operations',
    employmentType: 'Full-time',
    salary: 90000,
    startDate: '2024-03-15',
    status: 'Preboarding',
    joiningDate: '2024-04-01',
    preboardingStatus: 'Completed',
  },
];

export default function PreboardingPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  const employee = mockEmployees.find(emp => emp.id === employeeId);

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Employee Not Found</h1>
          <p className="text-gray-600 mb-4">The employee you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/dashboard/people')}>
            Back to People
          </Button>
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    navigate(`/dashboard/people/${employee.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/dashboard/people/${employee.id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {employee.firstName} {employee.lastName}
          </Button>
        </div>
      </div>

      {/* Preboarding Flow */}
      <PreboardingFlow
        employeeId={employee.id}
        employeeName={`${employee.firstName} ${employee.lastName}`}
        onComplete={handleComplete}
      />
    </div>
  );
}
