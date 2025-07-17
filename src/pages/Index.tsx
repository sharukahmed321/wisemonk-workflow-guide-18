import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BrandingSection } from '../components/BrandingSection';
import { AuthSection } from '../components/AuthSection';
import { OnboardingFlow } from '../components/OnboardingFlow';
import { Dashboard } from '../components/Dashboard';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const [appState, setAppState] = useState<'auth' | 'onboarding' | 'dashboard'>('auth');
  
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    
    if (user) {
      // User is authenticated
      if (location.pathname.startsWith('/dashboard')) {
        setAppState('dashboard');
      } else {
        // Check if user needs onboarding by checking their profile
        checkUserOnboardingStatus();
      }
    } else {
      // User is not authenticated
      setAppState('auth');
    }
  }, [user, loading, location]);

  const checkUserOnboardingStatus = async () => {
    // For now, assume all authenticated users go to dashboard
    // Later we can add logic to check if they completed onboarding
    setAppState('dashboard');
    if (!location.pathname.startsWith('/dashboard')) {
      window.history.pushState({}, '', '/dashboard');
    }
  };

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (appState === 'dashboard' && user) {
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
