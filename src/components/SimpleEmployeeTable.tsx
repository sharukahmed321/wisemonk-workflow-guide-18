
import { Employee } from '@/types/employee';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SimpleEmployeeTableProps {
  employees: Employee[];
}

const statusColors = {
  Active: 'bg-success/10 text-success border-success/20',
  Onboarding: 'bg-primary/10 text-primary border-primary/20',
  Preboarding: 'bg-secondary/10 text-secondary border-secondary/20',
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

export function SimpleEmployeeTable({ employees }: SimpleEmployeeTableProps) {
  const navigate = useNavigate();

  const handleViewProfile = (employeeId: string) => {
    navigate(`/dashboard/people/${employeeId}`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Job Title</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Employment Type</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Salary</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={employee.avatar} />
                  <AvatarFallback>
                    {employee.firstName[0]}{employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                  <div className="text-sm text-muted-foreground">{employee.employeeId}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>{employee.jobTitle}</TableCell>
            <TableCell>{employee.department}</TableCell>
            <TableCell>{employee.employmentType}</TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="text-sm">{employee.email}</div>
                <div className="text-sm text-muted-foreground">{employee.phone}</div>
              </div>
            </TableCell>
            <TableCell className="font-medium">{formatSalary(employee.salary)}</TableCell>
            <TableCell>
              <Badge className={statusColors[employee.status]}>
                {employee.status}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleViewProfile(employee.employeeId)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Profile
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
  );
}
