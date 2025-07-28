
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Employee } from '@/types/employee';
import { Download, Edit, MessageSquare, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

export function EmployeeProfileHeader({ employee }: EmployeeProfileHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            {/* Avatar - Larger and more prominent */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-2xl font-bold text-indigo-700">
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            </div>
            
            {/* Employee Info - Streamlined */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-xl text-gray-600">{employee.jobTitle}</p>
              <div className="flex items-center gap-3 text-base text-gray-500">
                <span>{employee.department}</span>
                <span>•</span>
                <span>{employee.employeeId}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status Badge */}
            <Badge className={getStatusColor(employee.status)}>
              {employee.status}
            </Badge>
          </div>
        </div>
        
        {/* Action Buttons Row */}
        <div className="mt-8 flex items-center gap-3">
          <Button variant="default" size="sm" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Documents
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                All Documents
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Identity Documents
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Employment Documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Send Message
          </Button>
        </div>
      </div>
    </div>
  );
}
