
import React from 'react';
import { MoreHorizontal, Edit, Trash2, Eye, FileText, Send, CheckCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Employee } from '@/types/employee';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface EmployeeTableProps {
  employees: Employee[];
  selectedStatus: string;
}

const getStatusTooltip = (status: string) => {
  switch (status) {
    case 'Documents Pending':
      return 'Documents not submitted';
    case 'Agreement Sent':
      return 'Documents submitted, agreement awaiting signature';
    case 'Agreement Signed':
      return 'Completed';
    default:
      return '';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Documents Pending':
      return FileText;
    case 'Agreement Sent':
      return Send;
    case 'Agreement Signed':
      return CheckCircle;
    default:
      return FileText;
  }
};

const formatJoiningDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

export function EmployeeTable({ employees, selectedStatus }: EmployeeTableProps) {
  const isPreboarding = selectedStatus === 'Preboarding';

  return (
    <TooltipProvider>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {!isPreboarding && (
                <TableHead className="w-[120px]">ID</TableHead>
              )}
              <TableHead className="min-w-[200px]">
                {isPreboarding ? 'Candidate Name' : 'Employee Name'}
              </TableHead>
              <TableHead>Job Title</TableHead>
              {isPreboarding ? (
                <>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <span>Status</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <div><strong>Documents Pending:</strong> Documents not submitted</div>
                            <div><strong>Agreement Sent:</strong> Documents submitted, agreement awaiting signature</div>
                            <div><strong>Agreement Signed:</strong> Completed</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                </>
              ) : (
                <TableHead>Contact</TableHead>
              )}
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => {
              const StatusIcon = getStatusIcon(employee.preboardingStatus || '');
              
              return (
                <TableRow key={employee.id} className="group">
                  {!isPreboarding && (
                    <TableCell className="font-mono text-sm font-medium">
                      {employee.employeeId}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground">
                          {employee.firstName} {employee.lastName}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.jobTitle}
                  </TableCell>
                  {isPreboarding ? (
                    <>
                      <TableCell className="text-muted-foreground">
                        {formatJoiningDate(employee.joiningDate || '')}
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-help text-muted-foreground hover:text-foreground">
                              <StatusIcon className="h-4 w-4" />
                              <span>{employee.preboardingStatus}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{getStatusTooltip(employee.preboardingStatus || '')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm text-foreground">{employee.email}</div>
                        <div className="text-sm text-muted-foreground">{employee.phone}</div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                        >
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
