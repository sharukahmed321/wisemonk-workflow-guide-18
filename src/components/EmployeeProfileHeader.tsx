import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Employee } from '@/types/employee';
import { Download, Edit, MessageSquare, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
interface EmployeeProfileHeaderProps {
  employee: Employee;
}
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
export function EmployeeProfileHeader({
  employee
}: EmployeeProfileHeaderProps) {
  return <div className="bg-white border-b border-gray-100 mb-8">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            {/* Avatar - Clean and prominent */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center border border-gray-100">
              <span className="text-xl font-semibold text-indigo-600">
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            </div>
            
            {/* Employee Info - Clean hierarchy */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-lg text-gray-600">{employee.jobTitle}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{employee.department}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>{employee.employeeId}</span>
              </div>
            </div>
          </div>
          
          {/* Status Badge - Clean positioning */}
          <Badge className={getStatusColor(employee.status)}>
            {employee.status}
          </Badge>
        </div>
        
        {/* Action Buttons - Clean row */}
        
      </div>
    </div>;
}