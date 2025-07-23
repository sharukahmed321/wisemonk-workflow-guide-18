
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StepOverview } from './StepOverview';
import { EmployeeDetailsStep, EmployeeDetailsData } from './EmployeeDetailsStep';
import { CompensationReviewStep, CompensationReviewData } from './CompensationReviewStep';
import { WizardStepIndicator } from './WizardStepIndicator';

export interface CompleteEmployeeData extends EmployeeDetailsData, CompensationReviewData {}

interface AddEmployeeTwoStepFormProps {
  onSuccess?: () => void;
}

const DRAFT_STORAGE_KEY = 'employee-form-draft';

export function AddEmployeeTwoStepForm({ onSuccess }: AddEmployeeTwoStepFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0); // 0 = overview, 1-2 = form steps
  const [employeeData, setEmployeeData] = useState<EmployeeDetailsData | null>(null);
  const [compensationData, setCompensationData] = useState<CompensationReviewData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load draft data on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.employeeData) {
          const employee = { ...draft.employeeData };
          if (employee.startDate) {
            employee.startDate = new Date(employee.startDate);
          }
          setEmployeeData(employee);
        }
        if (draft.compensationData) setCompensationData(draft.compensationData);
        if (draft.currentStep) setCurrentStep(draft.currentStep);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  const saveDraft = (step: number, data: any) => {
    const draftData = {
      currentStep: step,
      employeeData: step >= 1 ? data : employeeData,
      compensationData: step >= 2 ? data : compensationData
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const handleEmployeeDetailsComplete = (data: EmployeeDetailsData) => {
    setEmployeeData(data);
    saveDraft(1, data);
    setCurrentStep(2);
    toast({
      title: "Progress Saved",
      description: "Employee details saved. Final step: compensation and review.",
    });
  };

  const handleCompensationComplete = async (data: CompensationReviewData) => {
    setCompensationData(data);
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setShowSuccess(true);
    clearDraft();

    setTimeout(() => {
      onSuccess?.();
      navigate('/dashboard/people');
    }, 2500);
  };

  const handleSaveAndExit = () => {
    toast({
      title: "Draft Saved",
      description: "Your progress has been saved. You can continue later.",
    });
    navigate('/dashboard/people');
  };

  const wizardSteps = [
    {
      number: 1,
      title: 'Employee Details',
      isCompleted: currentStep > 1,
      isCurrent: currentStep === 1
    },
    {
      number: 2,
      title: 'Compensation & Review',
      isCompleted: currentStep > 2,
      isCurrent: currentStep === 2
    }
  ];

  // Success State
  if (showSuccess && employeeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <CardTitle className="text-xl">Employee Added Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {employeeData.firstName} {employeeData.lastName} has been added to your team.
            </p>
            <div className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Overview Step
  if (currentStep === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/people')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to People
          </Button>
        </div>
        <StepOverview onStart={() => setCurrentStep(1)} />
      </div>
    );
  }

  // Form Steps
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard/people')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              People
            </Button>
            /
            <span>Add Employee</span>
            /
            <span>Step {currentStep} of 2</span>
          </div>
          <Button variant="outline" onClick={handleSaveAndExit}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft & Exit
          </Button>
        </div>

        {/* Wizard Step Indicator */}
        <WizardStepIndicator steps={wizardSteps} />

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>{currentStep === 1 ? 'Employee Details' : 'Compensation & Review'}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <EmployeeDetailsStep 
                onNext={handleEmployeeDetailsComplete}
                defaultValues={employeeData || undefined}
              />
            )}
            {currentStep === 2 && employeeData && (
              <CompensationReviewStep 
                onNext={handleCompensationComplete}
                onBack={() => setCurrentStep(1)}
                employeeData={employeeData}
                isSubmitting={isSubmitting}
                defaultValues={compensationData || undefined}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
