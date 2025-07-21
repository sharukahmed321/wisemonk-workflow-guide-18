
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowRight, X, Lock } from "lucide-react";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
  action?: string;
  url?: string;
}

interface SetupProgressProps {
  completedSteps: string[];
  onStepClick: (stepId: string) => void;
  onDismiss: () => void;
}

export function SetupProgress({ completedSteps, onStepClick, onDismiss }: SetupProgressProps) {
  // Calculate progress based on specific percentages
  const getProgressPercentage = (completedSteps: string[]) => {
    if (completedSteps.includes('first-employee')) return 100;
    if (completedSteps.includes('msa')) return 75;
    if (completedSteps.includes('address')) return 50;
    if (completedSteps.includes('basic-info')) return 25;
    return 0;
  };

  // Determine which steps are active based on completion status
  const getStepStatus = (stepId: string, completedSteps: string[]) => {
    const completed = completedSteps.includes(stepId);
    let active = false;

    switch (stepId) {
      case 'basic-info':
        active = true; // Always active as first step
        break;
      case 'address':
        active = completedSteps.includes('basic-info');
        break;
      case 'msa':
        active = completedSteps.includes('address');
        break;
      case 'first-employee':
        active = completedSteps.includes('msa');
        break;
    }

    return { completed, active };
  };

  const setupSteps: SetupStep[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Personal and company details',
      ...getStepStatus('basic-info', completedSteps)
    },
    {
      id: 'address',
      title: 'Business Address',
      description: 'Add your company address information',
      ...getStepStatus('address', completedSteps),
      action: 'Add Address',
      url: '/dashboard/setup/address'
    },
    {
      id: 'msa',
      title: 'Master Service Agreement',
      description: 'Review and sign the MSA document',
      ...getStepStatus('msa', completedSteps),
      action: 'Sign Agreement',
      url: '/dashboard/setup/msa'
    },
    {
      id: 'first-employee',
      title: 'Add First Employee',
      description: 'Add your first team member',
      ...getStepStatus('first-employee', completedSteps),
      action: 'Add Employee',
      url: '/dashboard/add-employee'
    }
  ];

  const progressPercentage = getProgressPercentage(completedSteps);
  const isComplete = completedSteps.includes('first-employee');

  if (isComplete) {
    return null; // Don't show when complete
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 shadow-sm">
      <CardHeader className="pb-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Complete Setup
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {progressPercentage}% complete
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <Progress value={progressPercentage} className="h-1 mt-2" />
      </CardHeader>
      
      <CardContent className="space-y-1.5 p-4 pt-0">
        {setupSteps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
              step.completed 
                ? 'bg-success/10 border border-success/20' 
                : step.active
                ? 'bg-muted/30 hover:bg-muted/50'
                : 'bg-muted/10 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`flex-shrink-0 ${
                step.completed 
                  ? 'text-success' 
                  : step.active 
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/50'
              }`}>
                {step.completed ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : step.active ? (
                  <Circle className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
              </div>
              <div>
                <h3 className={`text-xs font-medium ${
                  step.completed 
                    ? 'text-success' 
                    : step.active
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
                }`}>
                  {step.title}
                </h3>
                <p className={`text-xs ${
                  step.active 
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
            
            {!step.completed && step.action && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStepClick(step.id)}
                disabled={!step.active}
                className={`ml-2 flex-shrink-0 h-6 text-xs ${
                  !step.active ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {step.action}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
