import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BrandingSection } from '../components/BrandingSection';
import { AuthSection } from '../components/AuthSection';
import { OnboardingFlow } from '../components/OnboardingFlow';
import { Dashboard } from '../components/Dashboard';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, isEmailVerified, session } = useAuth();
  const [appState, setAppState] = useState<'auth' | 'onboarding' | 'dashboard'>('auth');
  
  // Recovery session detection - Supabase sends different parameters for password reset
  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get('type');
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  
  // Debug logging to understand what parameters Supabase actually sends
  if (accessToken || refreshToken || type) {
    console.log('Password reset URL parameters detected:', {
      type,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      allParams: Object.fromEntries(searchParams.entries())
    });
  }
  
  // Supabase password reset links include type=recovery and auth tokens
  const isRecoverySession = Boolean((type === 'recovery' || searchParams.has('access_token')) && user);
  
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    
    console.log('Index useEffect - User:', user?.email, 'Email verified:', isEmailVerified, 'Location:', location.pathname, 'Recovery session:', isRecoverySession);
    
    if (user) {
      // Check for recovery session first
      if (isRecoverySession) {
        console.log('Recovery session detected - staying in auth state for password update');
        setAppState('auth');
        return;
      }
      
      // User is authenticated, but check if email is verified
      if (!isEmailVerified) {
        console.log('User authenticated but email not verified - staying in auth state');
        setAppState('auth');
        return;
      }
      
      // User is authenticated and email is verified
      if (location.pathname.startsWith('/onboarding')) {
        setAppState('onboarding');
      } else {
        // Check if user needs onboarding by checking their profile
        checkUserOnboardingStatus();
      }
    } else {
      // User is not authenticated
      setAppState('auth');
    }
  }, [user, loading, isEmailVerified, location, isRecoverySession]);

  const checkUserOnboardingStatus = async () => {
    try {
      // Check user profile and role with onboarding completion tracking
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, job_title, organization_id, onboarding_completed, onboarding_step')
        .eq('user_id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileError);
        // Default to onboarding on error for safety
        setAppState('onboarding');
        if (!location.pathname.startsWith('/onboarding')) {
          navigate('/onboarding', { replace: true });
        }
        return;
      }

      // Check user role
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role, organization_id')
        .eq('user_id', user?.id)
        .order('role')
        .limit(1);

      if (roleError) {
        console.error('Error checking user role:', roleError);
      }

      const role = userRole?.[0]?.role;
      const hasOrganization = profile?.organization_id || userRole?.[0]?.organization_id;

      // CRITICAL: Check onboarding completion flag first
      if (!profile?.onboarding_completed) {
        console.log('Redirecting to onboarding - onboarding not completed:', { 
          profile: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
            job_title: profile.job_title,
            organization_id: profile.organization_id,
            onboarding_completed: profile.onboarding_completed,
            onboarding_step: profile.onboarding_step
          } : null,
          role 
        });
        setAppState('onboarding');
        if (!location.pathname.startsWith('/onboarding')) {
          navigate('/onboarding', { replace: true });
        }
        return;
      }

      // ADDITIONAL VALIDATION: Double-check required fields even if marked complete
      if (!profile || !profile.first_name || !profile.last_name || !profile.job_title || !hasOrganization) {
        console.log('Redirecting to onboarding - missing required fields despite completion flag:', { 
          profile, role, hasOrganization 
        });
        
        // Reset onboarding completion flag since data is incomplete
        await supabase
          .from('profiles')
          .update({ 
            onboarding_completed: false,
            onboarding_step: 1 
          })
          .eq('user_id', user?.id);
          
        setAppState('onboarding');
        if (!location.pathname.startsWith('/onboarding')) {
          navigate('/onboarding', { replace: true });
        }
        return;
      }

      // PRIORITY 2: Role-based routing only AFTER onboarding is complete
      // If user is an employee with organization, redirect to people dashboard
      if (role === 'employee' && hasOrganization) {
        console.log('Redirecting to employee dashboard:', { profile, role });
        setAppState('dashboard');
        if (!location.pathname.startsWith('/dashboard/people')) {
          navigate('/dashboard/people', { replace: true });
        }
        return;
      }

      // PRIORITY 3: Default to main dashboard for complete profiles
      console.log('Redirecting to main dashboard - complete profile:', { profile, role });
      setAppState('dashboard');
      if (!location.pathname.startsWith('/dashboard')) {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to onboarding on error for safety
      setAppState('onboarding');
      if (!location.pathname.startsWith('/onboarding')) {
        navigate('/onboarding', { replace: true });
      }
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
              navigate('/dashboard', { replace: true });
            }}
            onSignUpComplete={() => {
              console.log('onSignUpComplete called - checking user onboarding status');
              checkUserOnboardingStatus();
            }}
            isRecoveryMode={isRecoverySession}
            onPasswordUpdateComplete={() => {
              console.log('Password updated successfully, redirecting to login');
              // Clear all URL parameters to prevent recovery mode from persisting
              navigate('/', { replace: true });
              // Force a small delay to ensure state cleanup
              setTimeout(() => {
                navigate('/?tab=signin', { replace: true });
                setAppState('auth');
              }, 100);
            }}
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
            navigate('/dashboard', { replace: true });
          }} />
        </div>
      </div>
    );
  }
  
  return <Dashboard />;
};

export default Index;