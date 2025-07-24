import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OTPVerificationProps {
  email: string;
  onBack: () => void;
  onVerified: () => void;
}

export function OTPVerification({ email, onBack, onVerified }: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length === 6) {
      setIsVerifying(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('verify-otp', {
          body: { email, code: otp }
        });

        if (error) throw error;

        if (data.valid) {
          toast.success("Email verified successfully!");
          onVerified();
        } else {
          toast.error(data.error || "Invalid verification code");
          setOtp('');
        }
      } catch (error: any) {
        console.error('OTP verification error:', error);
        toast.error(error.message || "Verification failed. Please try again.");
        setOtp('');
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleResend = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email }
      });

      if (error) throw error;

      if (data.success) {
        setCountdown(60);
        setCanResend(false);
        setOtp('');
        toast.success("Verification code sent!");
      } else {
        toast.error(data.error || "Failed to send code");
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast.error(error.message || "Failed to send verification code");
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8 lg:px-8 lg:w-1/2">
      <div className="mx-auto w-full max-w-sm">
        <div className="space-y-6">
          <button 
            onClick={onBack}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
            <p className="text-muted-foreground">
              We sent a verification code to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium text-foreground">
                Enter 6-digit code
              </label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {canResend ? (
                <button 
                  onClick={handleResend}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Resend code
                </button>
              ) : (
                `Resend code in ${countdown}s`
              )}
            </div>

            <Button 
              onClick={handleVerify}
              disabled={otp.length !== 6 || isVerifying}
              className="w-full h-11"
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

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