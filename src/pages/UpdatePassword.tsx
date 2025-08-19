import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PasswordUpdateForm } from '@/components/PasswordUpdateForm';
import { BrandingSection } from '@/components/BrandingSection';
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        // Check for error parameters in URL
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const error = urlParams.get('error') || hashParams.get('error');
        const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
        
        if (error) {
          if (errorCode === 'otp_expired') {
            setError('The password reset link has expired. Please request a new one.');
          } else {
            setError('There was an error with the password reset link. Please try again.');
          }
          setIsLoading(false);
          return;
        }

        // Check for recovery session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setHasValidSession(true);
        } else {
          setError('Invalid or expired password reset link.');
        }
      } catch (err) {
        console.error('Error checking recovery session:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    checkRecoverySession();
  }, []);

  const handlePasswordUpdateSuccess = () => {
    navigate('/?tab=signin');
  };

  const handleResendResetLink = () => {
    setShowForgotModal(true);
  };

  if (isLoading) {
    return <LoadingScreen message="Verifying reset link..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex">
        <BrandingSection />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            <Alert className="border-destructive/50 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <Button
                onClick={handleResendResetLink}
                className="w-full"
                variant="outline"
              >
                Request New Reset Link
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                className="w-full"
                variant="ghost"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
        
        <ForgotPasswordModal
          isOpen={showForgotModal}
          onClose={() => setShowForgotModal(false)}
        />
      </div>
    );
  }

  if (hasValidSession) {
    return (
      <div className="min-h-screen flex">
        <BrandingSection />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">Update Password</h1>
              <p className="text-muted-foreground mt-2">
                Enter your new password below
              </p>
            </div>
            
            <PasswordUpdateForm onSuccess={handlePasswordUpdateSuccess} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}