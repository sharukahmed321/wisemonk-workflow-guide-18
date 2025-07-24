
import React from 'react';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
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
      return 'Documents submitted and agreement signed';
    default:
      return '';
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
              <TableHead className="w-[120px]">
                {isPreboarding ? 'ID' : 'ID'}
              </TableHead>
              <TableHead className="min-w-[200px]">
                {isPreboarding ? 'Candidate Name' : 'Employee Name'}
              </TableHead>
              <TableHead>Job Title</TableHead>
              {isPreboarding ? (
                <>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Status</TableHead>
                </>
              ) : (
                <TableHead>Contact</TableHead>
              )}
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id} className="group">
                <TableCell className="font-mono text-sm font-medium">
                  {employee.employeeId}
                </TableCell>
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
                      {employee.joiningDate}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help text-muted-foreground hover:text-foreground">
                            {employee.preboardingStatus}
                          </span>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
