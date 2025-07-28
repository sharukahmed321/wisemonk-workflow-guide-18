
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types/employee';
import { Mail, Phone, Calendar, MapPin, User, Briefcase, Calendar as CalendarIcon, Building } from 'lucide-react';

interface OverviewTabProps {
  employee: Employee;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Onboarding':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Preboarding':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | React.ReactNode }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0">
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
    <div className="text-sm text-gray-900">{value}</div>
  </div>
);

export function OverviewTab({ employee }: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Personal Details Section */}
      <div className="bg-white rounded-lg border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-0">
              <InfoRow icon={Mail} label="Email" value={employee.email} />
              <InfoRow icon={Phone} label="Phone" value={employee.phone} />
              <InfoRow 
                icon={Calendar} 
                label="Birthday" 
                value={employee.birthday ? formatDate(employee.birthday) : '15 Aug 1990'} 
              />
            </div>
            
            <div className="space-y-0">
              <InfoRow 
                icon={MapPin} 
                label="Address" 
                value="123 Tech Street, Bangalore, 560001" 
              />
              <InfoRow 
                icon={User} 
                label="Emergency Contact" 
                value="John Doe (+91 98765 43210)" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Employment Information */}
      <div className="bg-white rounded-lg border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Employment Information</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-0">
              <InfoRow icon={Briefcase} label="Employee ID" value={employee.employeeId} />
              <InfoRow icon={Building} label="Job Title" value={employee.jobTitle} />
              <InfoRow icon={Building} label="Department" value={employee.department} />
            </div>
            
            <div className="space-y-0">
              <InfoRow icon={Briefcase} label="Employment Type" value={employee.employmentType} />
              <InfoRow icon={CalendarIcon} label="Start Date" value={formatDate(employee.startDate)} />
              <InfoRow 
                icon={User} 
                label="Status" 
                value={
                  <Badge className={getStatusColor(employee.status)}>
                    {employee.status}
                  </Badge>
                } 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
