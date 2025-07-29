import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Mail } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  onBack: () => void;
  onVerified: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({ 
  email, 
  onBack, 
  onVerified 
}) => {
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    setIsResending(true);
    setCanResend(false);
    setCountdown(60); // 60 second cooldown

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        console.error('Resend error:', error);
        toast({
          title: "Failed to resend",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
        setCanResend(true);
        setCountdown(0);
        return;
      }

      toast({
        title: "Verification email sent!",
        description: "A new verification link has been sent to your email.",
      });
    } catch (error: any) {
      console.error('Resend error:', error);
      toast({
        title: "Failed to resend",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      });
      setCanResend(true);
      setCountdown(0);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We've sent a verification link to <strong>{email}</strong>. 
          Click the link in your email to verify your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          Didn't receive the email?{' '}
          {canResend ? (
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </Button>
          ) : (
            <span>Resend in {countdown}s</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button variant="outline" onClick={onBack} className="w-full">
          Back to Sign In
        </Button>
      </CardFooter>
    </Card>
  );
};

interface EmailVerifiedProps {
  onContinue: () => void;
}

export function EmailVerified({ onContinue }: EmailVerifiedProps) {
  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8 lg:px-8 lg:w-1/2">
      <div className="mx-auto w-full max-w-sm">
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Email Verified!</h2>
            <p className="text-muted-foreground">
              Your email has been successfully verified. Let's set up your account.
            </p>
          </div>

          <Button onClick={onContinue} className="w-full h-11">
            Continue Setup
          </Button>
        </div>
      </div>
    </div>
  );
}