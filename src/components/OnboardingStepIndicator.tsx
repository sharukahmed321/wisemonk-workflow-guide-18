
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface OnboardingStepIndicatorProps {
  steps: Step[];
  className?: string;
}

export function OnboardingStepIndicator({ steps, className }: OnboardingStepIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Circle and Label */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                  step.isCompleted && "border-primary bg-primary text-primary-foreground",
                  step.isCurrent && !step.isCompleted && "border-primary bg-background text-primary",
                  !step.isCurrent && !step.isCompleted && "border-muted-foreground bg-background text-muted-foreground"
                )}
              >
                {step.isCompleted ? (
                  <Check className="h-5 w-5" />
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
              <div className="mx-4 flex-1">
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
