/**
 * OTP Verification Component for the Wisemonk HR Management System
 * 
 * @description
 * A secure and user-friendly email verification component that provides:
 * - 6-digit OTP input with keyboard navigation
 * - 60-second resend countdown timer
 * - Loading states for verification and resend operations
 * - Toast notifications for user feedback
 * - Responsive design with accessibility features
 */

import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { useToast } from "./ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface OTPVerificationFormProps {
  email: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
}

export function OTPVerificationForm({ email, onVerify, onResend, onBack }: OTPVerificationFormProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // Call the edge function to verify OTP
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          email,
          otp
        }
      });

      if (error) {
        console.error('OTP verification error:', error);
        toast({
          title: "Verification failed",
          description: error.message || "Invalid or expired code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Email verified!",
          description: "Your email has been successfully verified.",
        });
        onVerify(otp);
      } else {
        toast({
          title: "Verification failed",
          description: "Invalid or expired code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast({
        title: "Verification failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    
    try {
      // Call the edge function to send new OTP
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          email
        }
      });

      if (error) {
        console.error('OTP resend error:', error);
        toast({
          title: "Failed to resend",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Code sent",
          description: "A new verification code has been sent to your email.",
        });
        setCanResend(false);
        setCountdown(60);
        onResend();
      } else {
        toast({
          title: "Failed to resend",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('OTP resend error:', error);
      toast({
        title: "Failed to resend",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <div className="relative">
          <button
            onClick={onBack}
            className="absolute -top-2 left-0 p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        
        {/* Header Section */}
        <div className="text-center space-y-2 pt-8">
          <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
          <p className="text-gray-600">
            We've sent a verification code to
          </p>
          <p className="font-medium text-gray-900 break-all">{email}</p>
        </div>

        {/* OTP Input Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
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

          {/* Resend Section */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              Didn't receive the code?{' '}
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  {isResending ? 'Sending...' : 'Resend code'}
                </button>
              ) : (
                <span className="text-gray-400">
                  Resend in {countdown}s
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          disabled={otp.length !== 6 || isVerifying}
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
        >
          {isVerifying ? 'Verifying...' : 'Verify Email'}
        </Button>
      </div>
    </div>
  );
}
