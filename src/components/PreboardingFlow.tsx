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
  const {
    toast
  } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Initialize preboarding data
  const [preboardingData, setPreboardingData] = useState<PreboardingData>({
    personalDetails: {
      fullName: '',
      fatherName: '',
      dateOfBirth: new Date(),
      aadhaarNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: ''
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
        if (parsedData.personalDetails.fullName && parsedData.personalDetails.aadhaarNumber) {
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

      // Save personal details to database immediately and link user
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('employees')
            .update({
              full_name: personalDetails.fullName,
              father_name: personalDetails.fatherName,
              date_of_birth: personalDetails.dateOfBirth.toISOString().split('T')[0],
              aadhaar_number: personalDetails.aadhaarNumber,
              address_line_1: personalDetails.addressLine1,
              address_line_2: personalDetails.addressLine2,
              city: personalDetails.city,
              state: personalDetails.state,
              pincode: personalDetails.pincode,
              user_id: user.id // Link user to employee record
            })
            .eq('id', employeeId);
        }
      } catch (error) {
        console.error('Error saving personal details:', error);
        toast({
          title: "Warning",
          description: "Personal details saved locally but couldn't update database.",
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
      // Save personal details to the employee record
      const { error } = await supabase
        .from('employees')
        .update({
          full_name: preboardingData.personalDetails.fullName,
          father_name: preboardingData.personalDetails.fatherName,
          date_of_birth: preboardingData.personalDetails.dateOfBirth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
          aadhaar_number: preboardingData.personalDetails.aadhaarNumber,
          address_line_1: preboardingData.personalDetails.addressLine1,
          address_line_2: preboardingData.personalDetails.addressLine2,
          city: preboardingData.personalDetails.city,
          state: preboardingData.personalDetails.state,
          pincode: preboardingData.personalDetails.pincode,
          status: 'Active'
        })
        .eq('id', employeeId);

      if (error) {
        throw error;
      }

      // Clear localStorage
      localStorage.removeItem(`preboarding-${employeeId}`);
      
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
    return <div className="min-h-screen bg-muted/30 flex items-center justify-center">
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
      </div>;
  }
  return <div className="min-h-screen bg-muted/30">
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
            {currentStep === 1 && <PersonalDetailsStep data={preboardingData.personalDetails} onComplete={data => handleStepComplete(1, data)} onPrevious={handlePrevious} />}
            
            {currentStep === 2 && <BackgroundVerificationStep data={preboardingData.backgroundVerification} onComplete={data => handleStepComplete(2, data)} onPrevious={handlePrevious} />}
            
            {currentStep === 3 && <EmploymentAgreementStep data={preboardingData.employmentAgreement} onComplete={data => handleStepComplete(3, data)} onPrevious={handlePrevious} employeeId={employeeId} />}
          </CardContent>
        </Card>
      </div>
    </div>;
}