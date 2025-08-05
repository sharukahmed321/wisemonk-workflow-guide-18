import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface WizardStepIndicatorProps {
  steps: Step[];
  className?: string;
}

export function WizardStepIndicator({ steps, className }: WizardStepIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Circle and Label */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors",
                  step.isCompleted && "bg-primary border-primary text-primary-foreground",
                  step.isCurrent && !step.isCompleted && "border-primary text-primary bg-background",
                  !step.isCurrent && !step.isCompleted && "border-muted-foreground text-muted-foreground bg-background"
                )}
              >
                {step.isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    "text-sm font-medium",
                    step.isCurrent && "text-foreground",
                    step.isCompleted && "text-foreground",
                    !step.isCurrent && !step.isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </div>
              </div>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={cn(
                    "h-px w-full transition-colors",
                    step.isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}