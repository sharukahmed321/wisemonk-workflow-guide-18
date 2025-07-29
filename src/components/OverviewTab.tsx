
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Employee } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PreboardingStatusCard } from './PreboardingStatusCard';
import { 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Briefcase, 
  DollarSign, 
  Clock,
  User
} from 'lucide-react';

interface OverviewTabProps {
  employee: Employee;
}

export function OverviewTab({ employee }: OverviewTabProps) {
  const navigate = useNavigate();

  const handleStartPreboarding = () => {
    navigate(`/dashboard/preboarding/${employee.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Onboarding': return 'bg-blue-100 text-blue-800';
      case 'Preboarding': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{employee.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{employee.phone}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Employee ID</p>
              <p className="font-medium">{employee.employeeId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Employment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Building className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-medium">{employee.department}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Briefcase className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Job Title</p>
              <p className="font-medium">{employee.jobTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Employment Type</p>
              <p className="font-medium">{employee.employmentType}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Salary</p>
              <p className="font-medium">{formatSalary(employee.salary)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status and Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Status & Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Current Status</p>
            <Badge className={getStatusColor(employee.status)}>
              {employee.status}
            </Badge>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="font-medium">{formatDate(employee.startDate)}</p>
          </div>
          
          {employee.joiningDate && (
            <div>
              <p className="text-sm text-gray-600">Joining Date</p>
              <p className="font-medium">{formatDate(employee.joiningDate)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preboarding Status Card */}
      <PreboardingStatusCard 
        employee={employee} 
        onStartPreboarding={handleStartPreboarding}
      />
    </div>
  );
}
