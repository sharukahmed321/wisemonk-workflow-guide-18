import React, { useState, createContext, useContext, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { OnboardingStepIndicator } from './OnboardingStepIndicator';
import { PersonalInfoOnboardingStep } from './PersonalInfoOnboardingStep';
import { DocumentCollectionStep } from './DocumentCollectionStep';
import { BankDetailsStep } from './BankDetailsStep';
import { useToast } from '@/hooks/use-toast';

// Onboarding data interfaces
export interface PersonalInfoData {
  profilePicture?: File;
  phoneNumber: string;
  genderIdentity: string;
  dateOfBirth?: Date;
}

export interface DocumentData {
  graduationCert?: File;
  relievingLetter?: File;
  salarySlip?: File;
  resume?: File;
  passport?: File;
}

export interface BankDetailsData {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  panNumber: string;
  cancelledCheque?: File;
  hasUAN: boolean;
  uanNumber?: string;
}

export interface OnboardingData {
  personalInfo: PersonalInfoData;
  documentCollection: DocumentData;
  bankDetails: BankDetailsData;
}

// Context for sharing state across components
interface OnboardingContextType {
  data: OnboardingData;
  updatePersonalInfo: (info: Partial<PersonalInfoData>) => void;
  updateDocuments: (docs: Partial<DocumentData>) => void;
  updateBankDetails: (details: Partial<BankDetailsData>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within OnboardingProvider');
  }
  return context;
};

// Step configuration
const STEPS = [
  {
    number: 1,
    title: 'Personal Information',
    description: 'Complete your profile with basic personal details',
    timeEstimate: '3 minutes'
  },
  {
    number: 2,
    title: 'Document Collection',
    description: 'Upload your professional documents',
    timeEstimate: '10 minutes'
  },
  {
    number: 3,
    title: 'Bank & EPF Details',
    description: 'Provide your banking and EPF information',
    timeEstimate: '5 minutes'
  }
];

interface EmployeeOnboardingFlowProps {
  employeeId: string;
  employeeName: string;
  onComplete: () => void;
}

export function EmployeeOnboardingFlow({ employeeId, employeeName, onComplete }: EmployeeOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  // Initialize with empty data
  const [data, setData] = useState<OnboardingData>({
    personalInfo: {
      phoneNumber: '',
      genderIdentity: '',
    },
    documentCollection: {},
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      panNumber: '',
      hasUAN: false,
      uanNumber: '',
    }
  });

  // Auto-save to localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`onboarding-${employeeId}`);
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        setData(parsedData.data || data);
        setCompletedSteps(new Set(parsedData.completedSteps || []));
        setCurrentStep(parsedData.currentStep || 1);
      } catch (error) {
        console.error('Error loading saved onboarding data:', error);
      }
    }
  }, [employeeId]);

  useEffect(() => {
    const dataToSave = {
      data,
      completedSteps: Array.from(completedSteps),
      currentStep
    };
    localStorage.setItem(`onboarding-${employeeId}`, JSON.stringify(dataToSave));
  }, [data, completedSteps, currentStep, employeeId]);

  // Context value
  const contextValue: OnboardingContextType = {
    data,
    updatePersonalInfo: (info) => {
      setData(prev => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, ...info }
      }));
    },
    updateDocuments: (docs) => {
      setData(prev => ({
        ...prev,
        documentCollection: { ...prev.documentCollection, ...docs }
      }));
    },
    updateBankDetails: (details) => {
      setData(prev => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, ...details }
      }));
    },
    errors,
    setErrors
  };

  // Validation functions
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!data.personalInfo.phoneNumber) {
          newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^\d{10}$/.test(data.personalInfo.phoneNumber)) {
          newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
        }
        if (!data.personalInfo.genderIdentity) {
          newErrors.genderIdentity = 'Gender identity is required';
        }
        if (!data.personalInfo.dateOfBirth) {
          newErrors.dateOfBirth = 'Date of birth is required';
        }
        break;
      case 2:
        // Documents are optional, so no validation needed
        break;
      case 3:
        if (!data.bankDetails.bankName) {
          newErrors.bankName = 'Bank name is required';
        }
        if (!data.bankDetails.accountNumber) {
          newErrors.accountNumber = 'Account number is required';
        } else if (!/^\d{9,18}$/.test(data.bankDetails.accountNumber)) {
          newErrors.accountNumber = 'Please enter a valid account number';
        }
        if (!data.bankDetails.ifscCode) {
          newErrors.ifscCode = 'IFSC code is required';
        } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.bankDetails.ifscCode)) {
          newErrors.ifscCode = 'Please enter a valid IFSC code';
        }
        if (!data.bankDetails.panNumber) {
          newErrors.panNumber = 'PAN number is required';
        } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.bankDetails.panNumber)) {
          newErrors.panNumber = 'Please enter a valid PAN number';
        }
        if (!data.bankDetails.cancelledCheque) {
          newErrors.cancelledCheque = 'Bank proof document is required';
        }
        if (data.bankDetails.hasUAN && !data.bankDetails.uanNumber) {
          newErrors.uanNumber = 'UAN number is required when UAN is selected';
        } else if (data.bankDetails.hasUAN && !/^\d{12}$/.test(data.bankDetails.uanNumber)) {
          newErrors.uanNumber = 'Please enter a valid 12-digit UAN number';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Clear saved data on completion
    localStorage.removeItem(`onboarding-${employeeId}`);
    
    toast({
      title: "Onboarding Complete!",
      description: "Welcome to the team! Your account is now fully set up.",
    });
    
    onComplete();
  };

  const getStepProgress = () => {
    return Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoOnboardingStep />;
      case 2:
        return <DocumentCollectionStep />;
      case 3:
        return <BankDetailsStep />;
      default:
        return null;
    }
  };

  const currentStepData = STEPS[currentStep - 1];
  const isLastStep = currentStep === STEPS.length;
  const canProceed = Object.keys(errors).length === 0;

  return (
    <OnboardingContext.Provider value={contextValue}>
      <div className="min-h-screen bg-muted/30 px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Welcome to WiseMonk, {employeeName}!</h1>
            <p className="mt-2 text-muted-foreground">
              Let's complete your onboarding to get you fully set up
            </p>
          </div>

          {/* Progress Indicator */}
          <OnboardingStepIndicator 
            steps={STEPS.map((step, index) => ({
              number: step.number,
              title: step.title,
              isCompleted: completedSteps.has(step.number),
              isCurrent: currentStep === step.number
            }))}
          />

          {/* Main Card */}
          <Card className="mx-auto max-w-3xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {currentStepData.description} • Estimated time: {currentStepData.timeEstimate}
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  Step {currentStep} of {STEPS.length}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {renderCurrentStep()}
            </CardContent>

            {/* Navigation Footer */}
            <div className="border-t bg-muted/20 px-6 py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Progress: {getStepProgress()}%</span>
                  <div className="h-2 w-24 rounded-full bg-muted">
                    <div 
                      className="h-2 rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${getStepProgress()}%` }}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="flex items-center gap-2"
                >
                  {isLastStep ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Complete Onboarding
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </OnboardingContext.Provider>
  );
}
