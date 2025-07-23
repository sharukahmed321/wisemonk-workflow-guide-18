
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, DollarSign, CheckCircle } from 'lucide-react';

interface StepOverviewProps {
  onStart: () => void;
}

export function StepOverview({ onStart }: StepOverviewProps) {
  const steps = [
    {
      icon: User,
      title: 'Employee Details',
      description: 'Personal information, job title, and start date',
      time: '3-5 min'
    },
    {
      icon: DollarSign,
      title: 'Compensation & Review',
      description: 'Salary details and final review',
      time: '2-3 min'
    },
    {
      icon: CheckCircle,
      title: 'Complete',
      description: 'Employee added to your team',
      time: '1 min'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Add New Employee</h1>
        <p className="text-muted-foreground">
          Follow these simple steps to add a new team member
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, index) => (
          <Card key={index} className="relative">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
              <p className="text-xs text-muted-foreground">Estimated time: {step.time}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button onClick={onStart} size="lg">
          Start Adding Employee
        </Button>
      </div>
    </div>
  );
}
