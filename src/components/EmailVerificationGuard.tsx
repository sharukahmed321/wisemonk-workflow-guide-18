
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
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  useEffect(() => {
    if (user) {
      checkVerificationStatus();
      fetchVerificationAttempts();
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

  const fetchVerificationAttempts = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email_verification_attempts, email_verification_sent_at')
        .eq('email', user.email)
        .single();

      if (!error && data) {
        setVerificationAttempts(data.email_verification_attempts || 0);
        
        // Check if we're in cooldown
        if (data.email_verification_sent_at) {
          const lastSent = new Date(data.email_verification_sent_at);
          const now = new Date();
          const timeDiff = Math.floor((now.getTime() - lastSent.getTime()) / 1000);
          const cooldownRemaining = Math.max(0, 60 - timeDiff); // 1 minute cooldown
          
          if (cooldownRemaining > 0) {
            setCooldownTime(cooldownRemaining);
            setCanResend(false);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching verification attempts:', error);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email || !canResend) return;

    setIsResending(true);

    try {
      // Check if user can send verification email
      const { data: canSend, error: canSendError } = await supabase.rpc('can_send_verification_email', {
        user_email: user.email
      });

      if (canSendError) {
        throw canSendError;
      }

      if (!canSend) {
        toast({
          title: "Rate limit exceeded",
          description: "You've reached the daily limit for verification emails. Please try again tomorrow.",
          variant: "destructive",
        });
        return;
      }

      // Resend verification email
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (resendError) {
        throw resendError;
      }

      // Track the verification attempt
      await supabase.rpc('track_email_verification_attempt', {
        user_email: user.email
      });

      // Update local state
      setVerificationAttempts(prev => prev + 1);
      setCooldownTime(60); // 1 minute cooldown
      setCanResend(false);

      toast({
        title: "Verification email sent!",
        description: "Please check your email for the verification link.",
      });

    } catch (error: any) {
      console.error('Error resending verification:', error);
      toast({
        title: "Failed to send verification email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Show loading state while checking verification
  if (isVerified === null) {
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

          {verificationAttempts >= 3 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Multiple verification emails sent. Check your spam folder or contact support if needed.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleResendVerification}
              disabled={!canResend || isResending || verificationAttempts >= 5}
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
              ) : verificationAttempts >= 5 ? (
                "Daily limit reached"
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Verification attempts: {verificationAttempts}/5 today
            </div>
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
