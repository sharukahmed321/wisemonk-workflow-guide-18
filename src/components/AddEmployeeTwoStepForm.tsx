import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Save } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { StepOverview } from './StepOverview';
import { EmployeeDetailsStep, EmployeeDetailsData } from './EmployeeDetailsStep';
import { CompensationReviewStep, CompensationReviewData } from './CompensationReviewStep';
import { WizardStepIndicator } from './WizardStepIndicator';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

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
          // Parse date if it exists
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

  // Auto-save draft data
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

  const handleStartForm = () => {
    setCurrentStep(1);
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

    try {
      if (!employeeData) {
        throw new Error('Employee details are missing');
      }

      // Get user data to fetch organization ID
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.user.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('Organization not found. Please complete setup first.');
      }

      // Generate employee ID
      const randomNum = Math.floor(Math.random() * 999) + 1;
      const employeeId = `EMP${randomNum.toString().padStart(3, '0')}`;
      
      // Create employee in database
      const { error } = await supabase
        .from('employees')
        .insert({
          employee_id: employeeId,
          first_name: employeeData.firstName,
          last_name: employeeData.lastName,
          email: employeeData.email,
          phone: employeeData.phone,
          job_title: employeeData.jobTitle,
          department: 'Engineering', // Default department (could be enhanced later)
          employment_type: 'Full-time', // Default employment type (could be enhanced later)
          salary: data.salary,
          start_date: employeeData.startDate ? employeeData.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: 'Active',
          organization_id: profile.organization_id,
        });

      if (error) {
        console.error('Error creating employee:', error);
        throw error;
      }

      setShowSuccess(true);
      clearDraft();

      toast({
        title: "Success!",
        description: `${employeeData.firstName} ${employeeData.lastName} has been added to your team.`,
      });

      // Auto-redirect after success
      setTimeout(() => {
        onSuccess?.();
        navigate('/dashboard');
      }, 2500);
    } catch (error) {
      console.error('Error creating employee:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleSaveAndExit = () => {
    toast({
      title: "Draft Saved",
      description: "Your progress has been saved. You can continue later from where you left off.",
    });
    navigate('/dashboard');
  };

  const stepTitles = [
    'Getting Started',
    'Employee Details',
    'Compensation & Review'
  ];

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

  if (showSuccess && employeeData) {
    return (
      <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Employee Added Successfully!</h3>
                <p className="text-muted-foreground mt-1">
                  {employeeData.firstName} {employeeData.lastName} has been added to your team.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <StepOverview onStart={handleStartForm} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <span>/</span>
            <span>Add Employee</span>
            <span>/</span>
            <span className="text-foreground font-medium">Step {currentStep} of 2</span>
          </div>
          
          {currentStep > 0 && (
            <Button 
              variant="outline"
              size="sm"
              onClick={handleSaveAndExit}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Draft & Exit
            </Button>
          )}
        </div>

        {/* Wizard Step Indicator */}
        {currentStep > 0 && (
          <div className="py-6">
            <WizardStepIndicator steps={wizardSteps} />
          </div>
        )}

        {/* Main Content Card */}
        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold text-foreground">
              {stepTitles[currentStep]}
            </CardTitle>
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
                onBack={() => handleBackToStep(1)}
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