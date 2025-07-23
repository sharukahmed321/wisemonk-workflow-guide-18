
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStep {
  number: number;
  title: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface WizardStepIndicatorProps {
  steps: WizardStep[];
}

export function WizardStepIndicator({ steps }: WizardStepIndicatorProps) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center space-x-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors",
                  step.isCompleted && "bg-primary border-primary text-primary-foreground",
                  step.isCurrent && !step.isCompleted && "border-primary text-primary bg-background",
                  !step.isCurrent && !step.isCompleted && "border-muted-foreground/30 text-muted-foreground bg-background"
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
            {index < steps.length - 1 && (
              <div className="w-24 mx-6 mt-[-20px]">
                <div
                  className={cn(
                    "h-px w-full transition-colors",
                    step.isCompleted ? "bg-primary" : "bg-muted-foreground/20"
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
