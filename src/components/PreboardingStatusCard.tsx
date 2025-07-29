
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Employee } from '@/types/employee';
import { CheckCircle, Clock, FileText, AlertCircle, Mail } from 'lucide-react';

interface PreboardingStatusCardProps {
  employee: Employee;
  onStartPreboarding: () => void;
}

export function PreboardingStatusCard({ employee, onStartPreboarding }: PreboardingStatusCardProps) {
  if (employee.status !== 'Preboarding' && employee.status !== 'Invited') {
    return null;
  }

  const getStatusInfo = () => {
    if (employee.status === 'Invited') {
      return {
        icon: <Mail className="w-5 h-5 text-blue-500" />,
        color: 'blue',
        progress: 0,
        message: 'Invitation sent - waiting for employee to accept'
      };
    }

    switch (employee.preboardingStatus) {
      case 'Documents Pending':
        return {
          icon: <FileText className="w-5 h-5 text-orange-500" />,
          color: 'orange',
          progress: 10,
          message: 'Documents and personal details need to be completed'
        };
      case 'Agreement Sent':
        return {
          icon: <Clock className="w-5 h-5 text-blue-500" />,
          color: 'blue',
          progress: 70,
          message: 'Employment agreement is pending signature'
        };
      case 'Completed':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          color: 'green',
          progress: 100,
          message: 'Preboarding process completed successfully'
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-gray-500" />,
          color: 'gray',
          progress: 0,
          message: 'Preboarding not started'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const getDisplayStatus = () => {
    if (employee.status === 'Invited') {
      return 'Invitation Sent';
    }
    return employee.preboardingStatus || 'Not Started';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {statusInfo.icon}
          {employee.status === 'Invited' ? 'Invitation Status' : 'Preboarding Status'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current Status:</span>
          <Badge variant={statusInfo.color === 'green' ? 'default' : 'secondary'}>
            {getDisplayStatus()}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{statusInfo.progress}%</span>
          </div>
          <Progress value={statusInfo.progress} className="h-2" />
        </div>

        <p className="text-sm text-gray-600">
          {statusInfo.message}
        </p>

        {employee.joiningDate && (
          <div className="text-sm">
            <span className="text-gray-600">Joining Date: </span>
            <span className="font-medium">
              {new Date(employee.joiningDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {employee.status === 'Invited' && (
          <Button 
            onClick={onStartPreboarding}
            className="w-full"
            variant="outline"
          >
            Resend Invitation
          </Button>
        )}

        {employee.status === 'Preboarding' && employee.preboardingStatus !== 'Completed' && (
          <Button 
            onClick={onStartPreboarding}
            className="w-full"
            variant={statusInfo.progress > 0 ? 'outline' : 'default'}
          >
            {statusInfo.progress > 0 ? 'Continue Preboarding' : 'Start Preboarding'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
