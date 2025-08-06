import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PreboardingAlertProps {
  employee: {
    id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    status: string;
    start_date: string;
  };
  progress: number;
  dueDate?: Date | null;
}

export function PreboardingAlert({ employee, progress, dueDate }: PreboardingAlertProps) {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate(`/dashboard/preboarding/${employee.employee_id}`);
  };

  const formatDueDate = (date: Date | null | undefined): string => {
    if (!date) return 'TBD';
    
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `${diffDays} days`;
    return 'Overdue';
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Clock className="w-5 h-5" />
          Preboarding Progress
        </CardTitle>
        <CardDescription>
          Complete your preboarding checklist before your start date
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Progress saved</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Due: {formatDueDate(dueDate)}</span>
          </div>
        </div>
        
        <Button 
          onClick={handleContinue}
          className="w-full"
          size="lg"
        >
          Continue Preboarding
        </Button>
      </CardContent>
    </Card>
  );
}