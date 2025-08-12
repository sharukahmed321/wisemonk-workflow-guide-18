import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WizardStepIndicator } from './WizardStepIndicator';
import { PersonalDetailsStep } from './preboarding/PersonalDetailsStep';
import { BackgroundVerificationStep } from './preboarding/BackgroundVerificationStep';
import { EmploymentAgreementStep } from './preboarding/EmploymentAgreementStep';
import ProgressStateManager, { 
  PreboardingProgressData, 
  FileUploadStatus 
} from '@/lib/progressStateManager';
import { PreboardingData, PreboardingStep } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, FileText, Shield, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PreboardingFlowProps {
  employeeId: string;
  employeeName: string;
  onComplete?: () => void;
}

export function PreboardingFlow({
  employeeId,
  employeeName,
  onComplete
}: PreboardingFlowProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // File upload status tracking
  const [fileUploadStatus, setFileUploadStatus] = useState<Record<string, FileUploadStatus>>({});

  // Initialize preboarding data
  const [preboardingData, setPreboardingData] = useState<PreboardingData>({
    personalDetails: {
      fullName: '',
      fatherName: '',
      dateOfBirth: undefined,
      aadhaarNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: ''
    },
    backgroundVerification: {
      documents: {},
      payslips: {
        payslip1: { status: 'pending' },
        payslip2: { status: 'pending' },
        payslip3: { status: 'pending' }
      },
      uploadStatus: {
        panCard: 'pending',
        previousOfferLetter: 'pending'
      }
    },
    employmentAgreement: {
      agreedToTerms: false,
      digitalSignature: undefined,
      signatureDate: undefined,
      completedAt: undefined
    }
  });

  // Load saved data from localStorage
  useEffect(() => {
    const savedProgress = ProgressStateManager.loadPreboardingProgress(employeeId);
    
    if (savedProgress && ProgressStateManager.validatePreboardingData(savedProgress)) {
      // Check for lost files and show toast notification
      const hasLost = ProgressStateManager.hasLostFiles(savedProgress.fileUploadStatus);
      const lostFiles = ProgressStateManager.getLostFiles(savedProgress.fileUploadStatus);
      
      if (hasLost) {
        toast({
          title: "Previous progress detected",
          description: `Your progress has been restored. ${lostFiles.length} file(s) need to be re-selected to continue.`
        });
      } else {
        toast({
          title: "Previous progress detected",
          description: "Your progress has been restored. You can continue where you left off."
        });
      }
      
      // Set the saved data
      setCurrentStep(savedProgress.currentStep);
      setCompletedSteps(new Set(savedProgress.completedSteps));
      
      // Map the data structure
      setPreboardingData({
        personalDetails: savedProgress.personalDetailsData,
        backgroundVerification: savedProgress.backgroundVerificationData,
        employmentAgreement: savedProgress.employmentAgreementData
      });
      setFileUploadStatus(savedProgress.fileUploadStatus);
    }
  }, [employeeId, toast]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    const progressData: PreboardingProgressData = {
      currentStep,
      completedSteps: Array.from(completedSteps),
      personalDetailsData: preboardingData.personalDetails,
      backgroundVerificationData: preboardingData.backgroundVerification,
      employmentAgreementData: preboardingData.employmentAgreement,
      fileUploadStatus
    };
    ProgressStateManager.savePreboardingProgress(employeeId, progressData);
  }, [preboardingData, completedSteps, currentStep, fileUploadStatus, employeeId]);

  const steps: PreboardingStep[] = [{
    number: 1,
    title: 'Personal Details',
    description: 'Complete your personal information',
    isCompleted: completedSteps.has(1),
    isCurrent: currentStep === 1
  }, {
    number: 2,
    title: 'Background Verification',
    description: 'Upload required documents',
    isCompleted: completedSteps.has(2),
    isCurrent: currentStep === 2
  }, {
    number: 3,
    title: 'Employment Agreement',
    description: 'Review and sign agreement',
    isCompleted: completedSteps.has(3),
    isCurrent: currentStep === 3
  }];

  const handleStepComplete = async (step: number, data: any) => {
    setCompletedSteps(prev => new Set([...prev, step]));

    // Update the specific step data
    if (step === 1) {
      const personalDetails = data;
      setPreboardingData(prev => ({
        ...prev,
        personalDetails: personalDetails
      }));

      // Save personal details to database using service role edge function
      try {
        console.log('💾 Saving personal details to database...');
        const { data: response, error } = await supabase.functions.invoke('update-preboarding-data', {
          body: { 
            employeeId, 
            personalDetails, 
            stepNumber: 1 
          }
        });

        if (error) {
          throw error;
        }

        console.log('✅ Personal details saved successfully:', response);
        toast({
          title: "Success",
          description: "Personal details saved successfully!",
        });
      } catch (error) {
        console.error('❌ Error saving personal details:', error);
        toast({
          title: "Warning",
          description: "Personal details saved locally but couldn't update database. You can continue and we'll retry later.",
          variant: "destructive"
        });
      }
    } else if (step === 2) {
      setPreboardingData(prev => ({
        ...prev,
        backgroundVerification: data
      }));
    } else if (step === 3) {
      setPreboardingData(prev => ({
        ...prev,
        employmentAgreement: {
          ...data,
          completedAt: new Date()
        }
      }));
    }
    
    if (step < 3) {
      setCurrentStep(step + 1);
      toast({
        title: "Step completed!",
        description: `Step ${step} has been completed successfully.`
      });
    } else {
      // All steps completed
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // Final save of all preboarding data and mark employee as active
      console.log('🏁 Completing preboarding process...');
      const { data: response, error } = await supabase.functions.invoke('update-preboarding-data', {
        body: { 
          employeeId, 
          personalDetails: preboardingData.personalDetails, 
          stepNumber: 'complete',
          finalizeStatus: true
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Preboarding data finalized:', response);

      // Clear localStorage and progress tracking
      ProgressStateManager.clearPreboardingProgress(employeeId);
      
      console.log('✅ Preboarding completed successfully');
      
      // Trigger Zoho Sign for employment agreement
      console.log('🔄 Sending employment agreement for signing...');
      try {
        const { data: zohoResponse, error: zohoError } = await supabase.functions.invoke(
          'send-employment-for-signing',
          {
            body: { employeeId }
          }
        );

        if (zohoError) {
          console.error('❌ Error sending for signing:', zohoError);
          // Don't throw error - preboarding is still complete
          toast({
            title: "Preboarding completed!",
            description: "Welcome to the team! Note: There was an issue sending the agreement for signing.",
            variant: "default"
          });
        } else {
          console.log('✅ Employment agreement sent for signing:', zohoResponse);
          toast({
            title: "Preboarding completed!",
            description: "Welcome to the team! Your employment agreement has been sent for signing."
          });
        }
      } catch (signError) {
        console.error('❌ Failed to send for signing:', signError);
        // Don't throw error - preboarding is still complete
        toast({
          title: "Preboarding completed!",
          description: "Welcome to the team! Your preboarding is now complete."
        });
      }
      
      // Call the completion callback
      onComplete?.();
    } catch (error) {
      console.error('Error completing preboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete preboarding. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercentage = completedSteps.size / 3 * 100;

  if (completedSteps.size === 3 && isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <CardTitle>Completing Preboarding...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Progress value={100} className="mb-4" />
            <p className="text-muted-foreground">
              Please wait while we finalize your preboarding process.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {employeeName}!
          </h1>
          <p className="text-muted-foreground">
            Complete your preboarding process to join the team
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          
        </Card>

        {/* Step Indicator */}
        <WizardStepIndicator steps={steps} className="mb-8" />

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && (
              <PersonalDetailsStep 
                data={preboardingData.personalDetails} 
                onComplete={data => handleStepComplete(1, data)} 
                onPrevious={handlePrevious} 
                onDataChange={(data) => {
                  setPreboardingData(prev => ({
                    ...prev,
                    personalDetails: data
                  }));
                }}
                employeeId={employeeId}
              />
            )}
            
            {currentStep === 2 && (
              <BackgroundVerificationStep 
                data={preboardingData.backgroundVerification} 
                onComplete={data => handleStepComplete(2, data)} 
                onPrevious={handlePrevious} 
                employeeId={employeeId} 
                onDataChange={(data) => {
                  setPreboardingData(prev => ({
                    ...prev,
                    backgroundVerification: data
                  }));
                }}
              />
            )}
            
            {currentStep === 3 && (
              <EmploymentAgreementStep 
                data={preboardingData.employmentAgreement} 
                onComplete={data => handleStepComplete(3, data)} 
                onPrevious={handlePrevious} 
                employeeId={employeeId} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
