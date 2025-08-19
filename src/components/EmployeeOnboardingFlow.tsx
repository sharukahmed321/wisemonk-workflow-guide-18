import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { OnboardingStepIndicator } from './OnboardingStepIndicator';
import { PersonalInfoOnboardingStep } from './PersonalInfoOnboardingStep';
import { DocumentCollectionStep } from './DocumentCollectionStep';
import { BankDetailsStep } from './BankDetailsStep';
import ProgressStateManager, { OnboardingProgressData, FileUploadStatus } from '@/lib/progressStateManager';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Onboarding data interfaces
export interface PersonalInfoData {
  profilePicture?: File;
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
  setFormValidation?: (step: string, isValid: boolean) => void;
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
const STEPS = [{
  number: 1,
  title: 'Personal Information',
  description: 'Complete your profile with basic personal details',
  timeEstimate: '3 minutes'
}, {
  number: 2,
  title: 'Document Collection',
  description: 'Upload your professional documents',
  timeEstimate: '10 minutes'
}, {
  number: 3,
  title: 'Bank & EPF Details',
  description: 'Provide your banking and EPF information',
  timeEstimate: '5 minutes'
}];
interface EmployeeOnboardingFlowProps {
  employeeId: string;
  employeeName: string;
  onComplete: () => void;
}
export function EmployeeOnboardingFlow({
  employeeId,
  employeeName,
  onComplete
}: EmployeeOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formValidationStates, setFormValidationStates] = useState<Record<string, boolean>>({});
  const {
    toast
  } = useToast();

  // File upload status tracking
  const [fileUploadStatus, setFileUploadStatus] = useState<Record<string, FileUploadStatus>>({});

  // Initialize with empty data
  const [data, setData] = useState<OnboardingData>({
    personalInfo: {},
    documentCollection: {},
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      hasUAN: false
    }
  });
  const getFirstName = () => {
    return employeeName.split(' ')[0] || employeeName;
  };
  useEffect(() => {
    const savedProgress = ProgressStateManager.loadOnboardingProgress(employeeId);
    if (savedProgress && ProgressStateManager.validateOnboardingData(savedProgress)) {
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
      setData({
        personalInfo: savedProgress.personalInfoData,
        documentCollection: savedProgress.documentData,
        bankDetails: savedProgress.bankDetailsData
      });
      setFileUploadStatus(savedProgress.fileUploadStatus);
    }
  }, [employeeId, toast]);
  const setFormValidation = useCallback((step: string, isValid: boolean) => {
    setFormValidationStates(prev => ({
      ...prev,
      [step]: isValid
    }));
  }, []);
  useEffect(() => {
    const progressData: OnboardingProgressData = {
      currentStep,
      completedSteps: Array.from(completedSteps),
      personalInfoData: data.personalInfo,
      documentData: data.documentCollection,
      bankDetailsData: data.bankDetails,
      fileUploadStatus
    };
    ProgressStateManager.saveOnboardingProgress(employeeId, progressData);
  }, [data, completedSteps, currentStep, fileUploadStatus, employeeId]);

  // Context value
  const contextValue: OnboardingContextType = {
    data,
    updatePersonalInfo: info => {
      setData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          ...info
        }
      }));
    },
    updateDocuments: docs => {
      setData(prev => ({
        ...prev,
        documentCollection: {
          ...prev.documentCollection,
          ...docs
        }
      }));
    },
    updateBankDetails: details => {
      setData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          ...details
        }
      }));
    },
    errors,
    setErrors,
    setFormValidation
  };

  // Validation functions
  const validateStep = (step: number): boolean => {
    console.log(`Validating step ${step}:`, data);
    const newErrors: Record<string, string> = {};
    switch (step) {
      case 1:
        // Personal Info
        // No validation needed - all fields are optional
        setErrors({});
        return true;
      case 2:
        // Document Collection
        console.log('Validating documents:', data.documentCollection);
        if (!data.documentCollection.graduationCert) {
          newErrors.graduationCert = 'Certificate of Graduation is required';
        }
        if (!data.documentCollection.resume) {
          newErrors.resume = 'Latest Resume is required';
        }
        break;
      case 3:
        console.log('Validating bank details:', data.bankDetails);
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
        if (!data.bankDetails.cancelledCheque) {
          newErrors.cancelledCheque = 'Bank proof document is required';
        }
        if (data.bankDetails.hasUAN && !data.bankDetails.uanNumber) {
          newErrors.uanNumber = 'UAN number is required when UAN is selected';
        } else if (data.bankDetails.hasUAN && data.bankDetails.uanNumber && !/^\d{12}$/.test(data.bankDetails.uanNumber)) {
          newErrors.uanNumber = 'Please enter a valid 12-digit UAN number';
        }
        break;
    }
    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleNext = () => {
    console.log('Attempting to proceed from step:', currentStep);
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    } else {
      console.log('Validation failed, cannot proceed');
    }
  };
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleComplete = async () => {
    try {
      setIsSubmitting(true);

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('employeeId', employeeId);
      formData.append('onboardingData', JSON.stringify(data));

      // Append files with their original File objects
      if (data.personalInfo.profilePicture) {
        formData.append('profilePicture', data.personalInfo.profilePicture);
      }
      if (data.bankDetails.cancelledCheque) {
        formData.append('cancelledCheque', data.bankDetails.cancelledCheque);
      }
      if (data.documentCollection.graduationCert) {
        formData.append('graduationCert', data.documentCollection.graduationCert);
      }
      if (data.documentCollection.relievingLetter) {
        formData.append('relievingLetter', data.documentCollection.relievingLetter);
      }
      if (data.documentCollection.resume) {
        formData.append('resume', data.documentCollection.resume);
      }
      if (data.documentCollection.passport) {
        formData.append('passport', data.documentCollection.passport);
      }

      // Call the edge function
      const {
        data: result,
        error
      } = await supabase.functions.invoke('complete-employee-onboarding', {
        body: formData
      });
      if (error) {
        throw error;
      }
      if (!result.success) {
        throw new Error(result.error || 'Failed to complete onboarding');
      }

      // Clear localStorage and progress tracking on success
      ProgressStateManager.clearOnboardingProgress(employeeId);
      toast({
        title: "Onboarding Complete!",
        description: "Welcome to the team! Your account is now fully set up."
      });

      // Call onComplete callback
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setErrors({
        submit: error.message || 'Failed to complete onboarding. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const getStepProgress = () => {
    return Math.round((currentStep - 1) / (STEPS.length - 1) * 100);
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

  // Simplified validation logic using React Hook Form as primary source
  const hasCustomErrors = Object.keys(errors).length > 0;
  const currentStepKey = currentStep === 3 ? 'bankDetails' : `step${currentStep}`;
  const isFormValid = formValidationStates[currentStepKey] === true;

  // Debug logging for validation state
  console.log('🔍 Validation Debug Info:', {
    currentStep,
    currentStepKey,
    hasCustomErrors,
    isFormValid,
    errors,
    formValidationStates,
    dataSnapshot: {
      bankDetails: data.bankDetails,
      documents: Object.keys(data.documentCollection).filter(key => data.documentCollection[key as keyof DocumentData]),
      personalInfo: Object.keys(data.personalInfo).filter(key => data.personalInfo[key as keyof PersonalInfoData])
    }
  });

  // Simplified canProceed logic
  let canProceed = false;
  
  switch (currentStep) {
    case 1:
      // Personal info is always valid (optional fields)
      canProceed = true;
      break;
    case 2:
      // Document collection - check for required documents
      canProceed = !!(data.documentCollection.graduationCert && data.documentCollection.resume);
      break;
    case 3:
      // Bank details - use React Hook Form validation
      canProceed = isFormValid && !hasCustomErrors;
      break;
    default:
      canProceed = false;
  }

  console.log(`✅ Step ${currentStep} validation result:`, { canProceed, reason: getValidationReason() });
  
  function getValidationReason() {
    if (currentStep === 1) return 'Personal info always valid';
    if (currentStep === 2) return `Documents: ${data.documentCollection.graduationCert ? '✅' : '❌'} graduation, ${data.documentCollection.resume ? '✅' : '❌'} resume`;
    if (currentStep === 3) return `Form valid: ${isFormValid}, No errors: ${!hasCustomErrors}`;
    return 'Unknown step';
  }
  const hasValidationErrors = hasCustomErrors;
  return <OnboardingContext.Provider value={contextValue}>
      <div className="min-h-screen bg-muted/30 px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Welcome to Wisemonk, {getFirstName()}!</h1>
            <p className="mt-2 text-muted-foreground">
              Let's complete your onboarding to get you fully set up
            </p>
          </div>

          <OnboardingStepIndicator steps={STEPS.map((step, index) => ({
          number: step.number,
          title: step.title,
          isCompleted: completedSteps.has(step.number),
          isCurrent: currentStep === step.number
        }))} />

          <Card className="mx-auto max-w-3xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                </div>
                <div className="text-sm text-muted-foreground">
                  Step {currentStep} of {STEPS.length}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {renderCurrentStep()}
            </CardContent>

            <div className="border-t bg-muted/20 px-6 py-4">
              {hasValidationErrors}
              <div className="flex items-center justify-between">
                {currentStep > 1 ? <Button type="button" variant="outline" onClick={handlePrevious} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button> : <div></div>}

                <div className="flex items-center gap-3">
                  {!canProceed && !isSubmitting && <span className="text-sm text-muted-foreground">
                      Complete all required fields to continue
                    </span>}
                  <Button onClick={handleNext} disabled={!canProceed || isSubmitting} className="flex items-center gap-2">
                    {isSubmitting ? 'Submitting...' : isLastStep ? 'Submit' : 'Next'}
                    {!isSubmitting && !isLastStep && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </OnboardingContext.Provider>;
}