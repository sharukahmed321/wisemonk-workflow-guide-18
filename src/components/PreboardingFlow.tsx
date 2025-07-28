
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WizardStepIndicator } from './WizardStepIndicator';
import { PersonalDetailsStep } from './preboarding/PersonalDetailsStep';
import { BackgroundVerificationStep } from './preboarding/BackgroundVerificationStep';
import { EmploymentAgreementStep } from './preboarding/EmploymentAgreementStep';
import { PreboardingData, PreboardingStep } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, FileText, Shield, User } from 'lucide-react';

interface PreboardingFlowProps {
  employeeId: string;
  employeeName: string;
  onComplete?: () => void;
}

export function PreboardingFlow({ employeeId, employeeName, onComplete }: PreboardingFlowProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize preboarding data
  const [preboardingData, setPreboardingData] = useState<PreboardingData>({
    personalDetails: {
      phoneNumber: '',
      alternateEmail: '',
      currentAddress: '',
      permanentAddress: '',
      fatherName: '',
      aadhaarNumber: ''
    },
    backgroundVerification: {
      documents: {},
      uploadStatus: {
        panCard: 'pending',
        previousPayslips: 'pending',
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
    const savedData = localStorage.getItem(`preboarding-${employeeId}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setPreboardingData(parsedData);
        
        // Determine completed steps based on saved data
        const completed = new Set<number>();
        if (parsedData.personalDetails.phoneNumber && parsedData.personalDetails.currentAddress) {
          completed.add(1);
        }
        if (Object.keys(parsedData.backgroundVerification.documents).length > 0) {
          completed.add(2);
        }
        if (parsedData.employmentAgreement.agreedToTerms) {
          completed.add(3);
        }
        setCompletedSteps(completed);
      } catch (error) {
        console.error('Error loading saved preboarding data:', error);
      }
    }
  }, [employeeId]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(`preboarding-${employeeId}`, JSON.stringify(preboardingData));
  }, [preboardingData, employeeId]);

  const steps: PreboardingStep[] = [
    {
      number: 1,
      title: 'Personal Details',
      description: 'Complete your personal information',
      isCompleted: completedSteps.has(1),
      isCurrent: currentStep === 1
    },
    {
      number: 2,
      title: 'Background Verification',
      description: 'Upload required documents',
      isCompleted: completedSteps.has(2),
      isCurrent: currentStep === 2
    },
    {
      number: 3,
      title: 'Employment Agreement',
      description: 'Review and sign agreement',
      isCompleted: completedSteps.has(3),
      isCurrent: currentStep === 3
    }
  ];

  const handleStepComplete = (step: number, data: any) => {
    setCompletedSteps(prev => new Set([...prev, step]));
    
    // Update the specific step data
    if (step === 1) {
      setPreboardingData(prev => ({
        ...prev,
        personalDetails: data
      }));
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
        description: `Step ${step} has been completed successfully.`,
      });
    } else {
      // All steps completed
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      localStorage.removeItem(`preboarding-${employeeId}`);
      setIsLoading(false);
      
      toast({
        title: "Preboarding completed!",
        description: "Welcome to the team! Your preboarding is now complete.",
      });
      
      onComplete?.();
    }, 1500);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercentage = (completedSteps.size / 3) * 100;

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
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Preboarding Progress</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {completedSteps.size} of 3 steps completed
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(progressPercentage)}%
                </div>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
            <Progress value={progressPercentage} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Step Indicator */}
        <WizardStepIndicator steps={steps} className="mb-8" />

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && (
              <PersonalDetailsStep
                data={preboardingData.personalDetails}
                onComplete={(data) => handleStepComplete(1, data)}
                onPrevious={handlePrevious}
              />
            )}
            
            {currentStep === 2 && (
              <BackgroundVerificationStep
                data={preboardingData.backgroundVerification}
                onComplete={(data) => handleStepComplete(2, data)}
                onPrevious={handlePrevious}
              />
            )}
            
            {currentStep === 3 && (
              <EmploymentAgreementStep
                data={preboardingData.employmentAgreement}
                onComplete={(data) => handleStepComplete(3, data)}
                onPrevious={handlePrevious}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
