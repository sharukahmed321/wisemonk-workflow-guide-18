
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Employee, EmployeeStatus } from '@/types/employee';
import { EmployeeTable } from '@/components/EmployeeTable';
import { StatusTabs } from '@/components/StatusTabs';
import { Button } from '@/components/ui/button';

// Mock data matching the screenshot
const mockEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Product Manager',
    department: 'Engineering',
    employmentType: 'Full-time',
    salary: 85000,
    startDate: '2023-01-15',
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
    jobTitle: 'Data Analyst',
    department: 'Engineering',
    employmentType: 'Full-time',
    salary: 65000,
    startDate: '2024-03-15',
    status: 'Preboarding',
    joiningDate: '2024-04-01',
    preboardingStatus: 'Completed',
  },
];

export default function People() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus>('Active');

  const filteredEmployees = mockEmployees.filter(emp => emp.status === selectedStatus);

  const statusCounts = {
    Active: mockEmployees.filter(emp => emp.status === 'Active').length,
    Onboarding: mockEmployees.filter(emp => emp.status === 'Onboarding').length,
    Preboarding: mockEmployees.filter(emp => emp.status === 'Preboarding').length,
  };

  const handleAddEmployee = () => {
    navigate('/dashboard/people/add');
  };

  return (
    <div className="w-full p-6 md:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">People</h1>
            <p className="text-muted-foreground mt-0.5">
              Manage your team members and their information
            </p>
          </div>
          
          <Button onClick={handleAddEmployee} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>

        {/* Status Tabs */}
        <StatusTabs
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          statusCounts={statusCounts}
        />

        {/* Employee Table */}
        <EmployeeTable employees={filteredEmployees} selectedStatus={selectedStatus} />
      </div>
    </div>
  );
}
