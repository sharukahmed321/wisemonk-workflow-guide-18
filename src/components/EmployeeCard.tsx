import React from 'react';
import { MoreHorizontal, Edit, Trash2, Eye, Phone, Mail } from 'lucide-react';
import { Employee } from '@/types/employee';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface EmployeeCardProps {
  employee: Employee;
}

const statusColors = {
  Active: 'bg-success/10 text-success border-success/20',
  Onboarding: 'bg-primary/10 text-primary border-primary/20',
  Exit: 'bg-destructive/10 text-destructive border-destructive/20',
};

const formatSalary = (salary: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(salary);
};

export function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Avatar */}
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-primary">
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            </div>
            
            {/* Employee Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {employee.firstName} {employee.lastName}
                </h3>
                <Badge className={statusColors[employee.status]}>
                  {employee.status}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-1">
                {employee.jobTitle}
              </p>
              
              <p className="text-sm text-muted-foreground mb-3">
                {employee.department} • {employee.employmentType}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{employee.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{employee.phone}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Salary and Actions */}
          <div className="flex flex-col items-end gap-2">
            <span className="font-semibold text-foreground">
              {formatSalary(employee.salary)}
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}