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
    
    // Check URL parameters (both search and hash)
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));
    
    // Multiple ways to detect recovery session
    const hasRecoveryType = searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
    const hasAccessToken = hashParams.get('access_token');
    const hasRefreshToken = hashParams.get('refresh_token');
    const isUpdatePasswordMode = mode === 'update-password';
    const isAuthenticatedUser = session?.user?.aud === 'authenticated';
    
    // Log everything for debugging
    console.log('Recovery session analysis:', {
      hasRecoveryType,
      hasAccessToken: !!hasAccessToken,
      hasRefreshToken: !!hasRefreshToken,
      isUpdatePasswordMode,
      isAuthenticatedUser,
      sessionUser: session?.user,
      currentURL: window.location.href,
      searchParams: location.search,
      hashParams: location.hash
    });
    
    // Recovery session if we have the right indicators
    return (hasRecoveryType || (hasAccessToken && isUpdatePasswordMode)) && isAuthenticatedUser;
  }, [session, location.search, location.hash, mode]);

  // Handle authentication redirects
  useEffect(() => {
    if (loading) return;

    console.log('Auth redirect check:', { 
      user: !!user, 
      isEmailVerified, 
      isRecoverySession, 
      mode 
    });

    // Handle recovery sessions FIRST
    if (isRecoverySession) {
      if (mode !== 'update-password') {
        console.log('Recovery session detected, redirecting to update-password mode');
        navigate('/auth?mode=update-password', { replace: true });
      }
      return; // Don't process other redirects
    }

    // Handle normal authentication
    if (user && isEmailVerified) {
      console.log('Authenticated user, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    // Handle invalid recovery attempts
    if (mode === 'update-password' && !isRecoverySession) {
      console.log('Update password mode without valid recovery session, redirecting to sign-in');
      navigate('/auth?mode=sign-in', { replace: true });
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