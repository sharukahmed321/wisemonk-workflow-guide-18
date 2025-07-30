import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BrandingSection } from '@/components/BrandingSection';
import { SignInComponent } from '@/components/auth/SignInComponent';
import { ResetPasswordComponent } from '@/components/auth/ResetPasswordComponent';
import { UpdatePasswordComponent } from '@/components/auth/UpdatePasswordComponent';
import { Loader2 } from 'lucide-react';

type AuthMode = 'sign-in' | 'reset-password' | 'update-password';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, loading, isEmailVerified } = useAuth();

  // Parse mode from URL parameters
  const mode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get('mode');
    return (['sign-in', 'reset-password', 'update-password'].includes(modeParam)) 
      ? modeParam as AuthMode : 'sign-in';
  }, [location.search]);

  // Check if this is a recovery session (password reset)
  const isRecoverySession = useMemo(() => {
    if (!session) return false;
    
    // Check multiple indicators for recovery session
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));
    
    const hasRecoveryType = params.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
    const isAuthenticatedAud = session?.user?.aud === 'authenticated';
    
    console.log('Recovery session check:', {
      hasRecoveryType,
      isAuthenticatedAud,
      searchParams: location.search,
      hashParams: location.hash,
      sessionAud: session?.user?.aud
    });
    
    return isAuthenticatedAud && hasRecoveryType;
  }, [session, location.search, location.hash]);

  // Handle authentication redirects
  useEffect(() => {
    if (loading) return;

    // If user is authenticated and email verified, redirect to dashboard
    if (user && isEmailVerified && !isRecoverySession) {
      navigate('/dashboard');
      return;
    }

    // If in update-password mode but no valid recovery session, redirect to sign-in
    if (mode === 'update-password' && !isRecoverySession) {
      navigate('/auth?mode=sign-in');
      return;
    }

    // If recovery session but not in update-password mode, redirect to update-password
    if (isRecoverySession && mode !== 'update-password') {
      navigate('/auth?mode=update-password');
      return;
    }
  }, [user, isEmailVerified, loading, mode, isRecoverySession, navigate]);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  const handleSignInComplete = () => {
    navigate('/dashboard');
  };

  const handleResetComplete = () => {
    navigate('/auth?mode=sign-in');
  };

  const handleUpdateComplete = () => {
    navigate('/auth?mode=sign-in');
  };

  const renderAuthComponent = () => {
    switch (mode) {
      case 'reset-password':
        return <ResetPasswordComponent onComplete={handleResetComplete} />;
      case 'update-password':
        return <UpdatePasswordComponent onComplete={handleUpdateComplete} />;
      default:
        return <SignInComponent onComplete={handleSignInComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <BrandingSection />
        {renderAuthComponent()}
      </div>
    </div>
  );
}