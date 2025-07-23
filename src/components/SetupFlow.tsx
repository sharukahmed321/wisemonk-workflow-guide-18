
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PersonalInfoStep } from './PersonalInfoStep';
import { CompanyInfoStep } from './CompanyInfoStep';
import { AddressStep } from './AddressStep';
import { MSAStep } from './MSAStep';
import { SetupProgress } from './SetupProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export interface OnboardingData {
  user_id: string;
  basic_info: {
    completed: boolean;
    completed_at: string | null;
    status: string;
    data: {
      first_name: string;
      last_name: string;
      job_title: string;
    };
  };
  company_info: {
    completed: boolean;
    completed_at: string | null;
    status: string;
    data: {
      company_name: string;
      company_legal_name: string;
      country: string;
      employee_count: string;
    };
  };
  address_info: {
    completed: boolean;
    completed_at: string | null;
    status: string;
    data: {
      business_address: string;
      business_city: string;
      business_state: string;
      business_postal_code: string;
    };
  };
  msa_info: {
    completed: boolean;
    completed_at: string | null;
    status: string;
    data: {
      msa_signed: boolean;
      msa_signed_at: string | null;
      msa_signed_by: string | null;
    };
  };
  overall_progress: {
    setup_completed: boolean;
    setup_completed_at: string | null;
    completion_percentage: number;
  };
  organization: any;
}

export function SetupFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const steps = [
    { id: 'personal', title: 'Personal Information', component: PersonalInfoStep },
    { id: 'company', title: 'Company Information', component: CompanyInfoStep },
    { id: 'address', title: 'Address Information', component: AddressStep },
    { id: 'msa', title: 'MSA Agreement', component: MSAStep },
  ];

  useEffect(() => {
    if (user) {
      fetchOnboardingData();
    }
  }, [user]);

  const fetchOnboardingData = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_onboarding_progress', { user_id_param: user?.id });

      if (error) throw error;

      setOnboardingData(data);
      
      // Determine current step based on completion status
      if (!data.basic_info.completed) {
        setCurrentStep(0);
      } else if (!data.company_info.completed) {
        setCurrentStep(1);
      } else if (!data.address_info.completed) {
        setCurrentStep(2);
      } else if (!data.msa_info.completed) {
        setCurrentStep(3);
      } else {
        // All steps completed
        setCurrentStep(4);
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepComplete = () => {
    fetchOnboardingData();
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Setup completed, navigate to dashboard
      navigate('/');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading setup...</p>
        </div>
      </div>
    );
  }

  if (!onboardingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load onboarding data</p>
          <Button onClick={fetchOnboardingData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show completion screen if all steps are done
  if (onboardingData.overall_progress.setup_completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Setup Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Your account has been successfully set up. You can now access all features.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep]?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Setup</h1>
          <p className="text-gray-600">Complete your profile to get started</p>
        </div>

        <SetupProgress 
          currentStep={currentStep}
          totalSteps={steps.length}
          onboardingData={onboardingData}
        />

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep]?.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {CurrentStepComponent && (
                <CurrentStepComponent
                  onboardingData={onboardingData}
                  onStepComplete={handleStepComplete}
                  onNext={handleNextStep}
                  onPrev={handlePrevStep}
                  canGoNext={currentStep < steps.length - 1}
                  canGoPrev={currentStep > 0}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
