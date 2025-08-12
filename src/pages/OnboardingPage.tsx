import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { BrandingSection } from '@/components/BrandingSection';

export default function OnboardingPage() {
  const navigate = useNavigate();

  const handleOnboardingComplete = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex bg-background">
      <BrandingSection />
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        </div>
      </div>
    </div>
  );
}