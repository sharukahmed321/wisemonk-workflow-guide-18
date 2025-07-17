import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BrandingSection } from '../components/BrandingSection';
import { AuthSection } from '../components/AuthSection';
import { OnboardingFlow } from '../components/OnboardingFlow';
import { Dashboard } from '../components/Dashboard';

const Index = () => {
  const location = useLocation();
  const [appState, setAppState] = useState('auth'); // 'auth', 'onboarding', 'dashboard'
  
  // Check if we're on a dashboard route
  useEffect(() => {
    if (location.pathname.startsWith('/dashboard')) {
      setAppState('dashboard');
    }
  }, [location]);
  
  if (appState === 'dashboard') {
    return <Dashboard />;
  }
  
  if (appState === 'auth') {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex min-h-screen">
          <BrandingSection />
          <AuthSection 
            onSignInComplete={() => {
              setAppState('dashboard');
              window.history.pushState({}, '', '/dashboard');
            }}
            onSignUpComplete={() => setAppState('onboarding')} 
          />
        </div>
      </div>
    );
  }
  
  if (appState === 'onboarding') {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex min-h-screen">
          <BrandingSection />
          <OnboardingFlow onComplete={() => {
            setAppState('dashboard');
            window.history.pushState({}, '', '/dashboard');
          }} />
        </div>
      </div>
    );
  }
  
  return <Dashboard />;
};

export default Index;
