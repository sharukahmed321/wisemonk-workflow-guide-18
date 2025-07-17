
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowRight, X } from "lucide-react";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: string;
  url?: string;
}

interface SetupProgressProps {
  completedSteps: string[];
  onStepClick: (stepId: string) => void;
  onDismiss: () => void;
}

const setupSteps: SetupStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Personal and company details',
    completed: false
  },
  {
    id: 'address',
    title: 'Business Address',
    description: 'Add your company address information',
    completed: false,
    action: 'Add Address',
    url: '/dashboard/setup/address'
  },
  {
    id: 'msa',
    title: 'Master Service Agreement',
    description: 'Review and sign the MSA document',
    completed: false,
    action: 'Sign Agreement',
    url: '/dashboard/setup/msa'
  },
  {
    id: 'first-employee',
    title: 'Add First Employee',
    description: 'Add your first team member',
    completed: false,
    action: 'Add Employee',
    url: '/dashboard/add-employee'
  }
];

export function SetupProgress({ completedSteps, onStepClick, onDismiss }: SetupProgressProps) {
  const updatedSteps = setupSteps.map(step => ({
    ...step,
    completed: completedSteps.includes(step.id)
  }));

  const completedCount = updatedSteps.filter(step => step.completed).length;
  const progressPercentage = (completedCount / setupSteps.length) * 100;
  const isComplete = completedCount === setupSteps.length;

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
                {Math.round(progressPercentage)}% complete
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
        {updatedSteps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
              step.completed 
                ? 'bg-success/10 border border-success/20' 
                : 'bg-muted/30 hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`flex-shrink-0 ${
                step.completed ? 'text-success' : 'text-muted-foreground'
              }`}>
                {step.completed ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
              </div>
              <div>
                <h3 className={`text-xs font-medium ${
                  step.completed ? 'text-success' : 'text-foreground'
                }`}>
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
            
            {!step.completed && step.action && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStepClick(step.id)}
                className="ml-2 flex-shrink-0 h-6 text-xs"
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
