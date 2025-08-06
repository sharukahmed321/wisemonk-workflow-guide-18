import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  Clock, 
  UserPlus, 
  User,
  AlertCircle 
} from 'lucide-react';

type EmployeeStatus = 'Active' | 'Onboarding' | 'Preboarding' | 'Invited' | 'Exit';

interface EmployeeStatusBadgeProps {
  status: EmployeeStatus;
  className?: string;
}

export function EmployeeStatusBadge({ status, className }: EmployeeStatusBadgeProps) {
  const getStatusConfig = (status: EmployeeStatus) => {
    switch (status) {
      case 'Active':
        return {
          color: 'bg-success/10 text-success border-success/20',
          icon: <CheckCircle className="h-3 w-3" />,
          label: 'Active'
        };
      case 'Onboarding':
        return {
          color: 'bg-primary/10 text-primary border-primary/20',
          icon: <UserPlus className="h-3 w-3" />,
          label: 'Onboarding'
        };
      case 'Preboarding':
        return {
          color: 'bg-warning/10 text-warning-foreground border-warning/20',
          icon: <Clock className="h-3 w-3" />,
          label: 'Preboarding'
        };
      case 'Invited':
        return {
          color: 'bg-muted text-muted-foreground border-border',
          icon: <User className="h-3 w-3" />,
          label: 'Invited'
        };
      case 'Exit':
        return {
          color: 'bg-destructive/10 text-destructive border-destructive/20',
          icon: <AlertCircle className="h-3 w-3" />,
          label: 'Exit'
        };
      default:
        return {
          color: 'bg-muted text-muted-foreground border-border',
          icon: <AlertCircle className="h-3 w-3" />,
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <Badge className={cn("gap-1 text-xs font-medium border", statusConfig.color, className)}>
      {statusConfig.icon}
      {statusConfig.label}
    </Badge>
  );
}