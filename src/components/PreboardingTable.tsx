
import { Employee } from '@/types/employee';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, FileText, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

interface PreboardingTableProps {
  employees: Employee[];
}

const bgvStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
};

const agreementStatusColors = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  sent: 'bg-blue-100 text-blue-800 border-blue-200',
  signed: 'bg-green-100 text-green-800 border-green-200',
};

export function PreboardingTable({ employees }: PreboardingTableProps) {
  const navigate = useNavigate();

  const handleViewProfile = (employeeId: string) => {
    navigate(`/dashboard/people/${employeeId}`);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Job Title</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>BGV Status</TableHead>
          <TableHead>Agreement Status</TableHead>
          <TableHead>Start Date</TableHead>
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
            <TableCell>
              <div>
                <div className="font-medium">{employee.jobTitle}</div>
                <div className="text-sm text-muted-foreground">{employee.department}</div>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Progress 
                    value={employee.preboarding?.overallProgress || 0} 
                    className="flex-1"
                  />
                  <span className="text-sm font-medium min-w-[40px]">
                    {employee.preboarding?.overallProgress || 0}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {employee.preboarding?.overallProgress >= 90 ? 'Ready to activate' : 
                   employee.preboarding?.overallProgress >= 50 ? 'In progress' : 
                   'Documents needed'}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={bgvStatusColors[employee.preboarding?.bgvStatus || 'pending']}>
                {employee.preboarding?.bgvStatus || 'pending'}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={agreementStatusColors[employee.preboarding?.agreementStatus || 'pending']}>
                {employee.preboarding?.agreementStatus || 'pending'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {new Date(employee.startDate).toLocaleDateString()}
              </div>
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
                    <FileText className="mr-2 h-4 w-4" />
                    Documents
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activate
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
