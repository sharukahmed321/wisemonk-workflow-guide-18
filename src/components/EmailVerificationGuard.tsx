import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Mail, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
}

export function EmailVerificationGuard({ children }: EmailVerificationGuardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (user) {
      checkVerificationStatus();
    } else {
      // If no user, immediately set as not verified to allow children to render
      // This prevents the loading state during sign out
      setIsVerified(false);
    }
  }, [user]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime(cooldownTime - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [cooldownTime]);

  const checkVerificationStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('is_email_verified', {
        user_id: user.id
      });

      if (error) {
        console.error('Error checking verification status:', error);
        return;
      }

      setIsVerified(data);
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email || !canResend) return;

    setIsResending(true);

    try {
      // Resend verification email using Supabase auth
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });

      if (error) {
        console.error('Resend verification error:', error);
        toast({
          title: "Failed to resend verification",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Verification email sent",
        description: "Please check your email and click the verification link.",
      });

      // Set cooldown
      setCooldownTime(60); // 1 minute cooldown
      setCanResend(false);

    } catch (error: any) {
      console.error('Error resending verification:', error);
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Show loading state while checking verification
  // If no user, render children immediately (will redirect via Index page)
  if (isVerified === null && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Checking verification status...</span>
        </div>
      </div>
    );
  }

  // If email is verified, render children (the dashboard)
  if (isVerified) {
    return <>{children}</>;
  }

  // Show verification required screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Email Verification Required</CardTitle>
          <CardDescription>
            Please verify your email address to access your dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              We've sent a verification email to <strong>{user?.email}</strong>. 
              Click the link in the email to verify your account.
            </AlertDescription>
          </Alert>

          <Alert className="mb-4">
            <AlertDescription>
              If you don't see the email, check your spam folder.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={handleResendVerification}
              disabled={!canResend || isResending}
              className="w-full"
              variant={canResend ? "default" : "secondary"}
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : cooldownTime > 0 ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Resend in {cooldownTime}s
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t text-center text-sm text-muted-foreground">
            Need help? Contact support at{' '}
            <a href="mailto:support@yourapp.com" className="text-primary hover:underline">
              support@yourapp.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}