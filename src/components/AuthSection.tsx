import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Alert, AlertDescription } from "./ui/alert";
import { OTPVerificationForm } from "./OTPVerificationForm";
import { EmailVerified } from "./OTPVerification";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { AccountLockoutModal } from "./AccountLockoutModal";
import { LoadingScreen } from "./LoadingScreen";
import { PasswordUpdateForm } from "./PasswordUpdateForm";
import { Eye, EyeOff, Shield, AlertCircle, Clock, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthSectionProps {
  onSignInComplete: () => void;
  onSignUpComplete: () => void;
  isRecoveryMode?: boolean;
  onPasswordUpdateComplete?: () => void;
}

interface SecurityStatus {
  email: string;
  is_locked: boolean;
  locked_until: string | null;
  lock_reason: string | null;
  failed_attempts: number;
  last_failed_login: string | null;
  last_successful_login: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  verification_attempts: number;
  last_verification_sent: string | null;
}

interface UserExistenceStatus {
  exists: boolean;
  email_verified: boolean;
  profile_exists: boolean;
  user_id: string | null;
  status: 'new_user' | 'unverified' | 'partial_registration' | 'complete' | 'unknown';
}

const signInSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform(val => val.trim().toLowerCase()), // T24: Auto-trim and normalize email
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

const signUpSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform(val => val.trim().toLowerCase()), // T24: Auto-trim and normalize email
  password: z.string()
    .min(1, 'Password is required') // T4: Better required field validation
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export function AuthSection({ onSignInComplete, onSignUpComplete, isRecoveryMode, onPasswordUpdateComplete }: AuthSectionProps) {
  const [authState, setAuthState] = useState<'auth' | 'email-check' | 'verified'>('auth');
  const [userEmail, setUserEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [lockoutModalOpen, setLockoutModalOpen] = useState(false);
  const [lockoutData, setLockoutData] = useState<SecurityStatus | null>(null);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [isTimeout, setIsTimeout] = useState(false); // T27: Track timeout state
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // T27: Track offline state
  const { toast } = useToast();

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  // Rate limiting cooldown timer
  useEffect(() => {
    if (rateLimitCooldown > 0) {
      const timer = setTimeout(() => setRateLimitCooldown(rateLimitCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitCooldown]);

  // T27: Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check account security status
  const checkAccountSecurity = async (email: string): Promise<SecurityStatus | null> => {
    try {
      const { data, error } = await supabase.rpc('get_account_security_status', {
        user_email: email
      });

      if (error) {
        console.error('Error checking account security:', error);
        return null;
      }

      // Type cast the Json response to our SecurityStatus interface using two-step conversion
      return data as unknown as SecurityStatus;
    } catch (error) {
      console.error('Error checking account security:', error);
      return null;
    }
  };

  // Log authentication events to audit table
  const logAuthEvent = async (eventType: string, success: boolean, details?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('auth_audit_logs').insert({
        user_id: user?.id || null,
        event_type: eventType,
        success,
        details: details || {},
        ip_address: null, // Will be filled by database trigger if needed
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  };

  // Track failed login attempts with enhanced security
  const updateFailedLoginAttempts = async (email: string, increment: boolean = true) => {
    try {
      if (increment) {
        // Increment failed attempts using RPC function
        const { error } = await supabase.rpc('increment_failed_login_attempts', {
          user_email: email
        });
        
        if (!error) {
          setShowForgotPassword(true);
          
          // Check if account should be locked
          const securityStatus = await checkAccountSecurity(email);
          if (securityStatus?.is_locked) {
            setLockoutData(securityStatus);
            setLockoutModalOpen(true);
          }
        }
      } else {
        // Reset failed attempts on successful login
        await supabase.rpc('reset_failed_login_attempts', {
          user_email: email
        });
      }
    } catch (error) {
      console.error('Error updating failed login attempts:', error);
    }
  };

  const onSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // T5: Validate against whitespace-only input
      if (!data.email.trim() || !data.password.trim()) {
        setError('Email and password cannot be empty or contain only spaces.');
        return;
      }

      // T22, T23: Sanitize inputs
      const sanitizedEmail = sanitizeInput(data.email.trim().toLowerCase());

      // T17: Check if user exists before attempting login
      const accountExists = await checkExistingAccount(sanitizedEmail);
      if (!accountExists) {
        setError('No account found with this email address. Please sign up first.');
        return;
      }

      // T18: Check email verification status
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', sanitizedEmail)
        .single();

      if (profileData?.user_id) {
        // Check if email is verified in auth.users
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id !== profileData.user_id) {
          // Need to check verification status for this specific user
          const isVerified = await supabase.rpc('is_email_verified', {
            user_id: profileData.user_id
          });
          
          if (!isVerified) {
            setError('Please verify your email address before signing in. Check your inbox for the verification link.');
            // T29: Show option to resend verification
            setShowForgotPassword(true);
            return;
          }
        }
      }

      // First check if account is locked
      const securityStatus = await checkAccountSecurity(sanitizedEmail);
      if (securityStatus?.is_locked) {
        setLockoutData(securityStatus);
        setLockoutModalOpen(true);
        setIsLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: data.password,
      });

      if (authError) {
        await logAuthEvent('sign_in_failed', false, { 
          email: sanitizedEmail, 
          error: authError.message 
        });
        
        if (authError.message.includes('Invalid login credentials')) {
          await updateFailedLoginAttempts(sanitizedEmail, true);
          setError('Invalid email or password. Please check your credentials and try again.');
          
          // Add rate limiting for repeated failures
          setRateLimitCooldown(5); // 5 second cooldown after failed attempt
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in. Check your inbox for the verification link.');
          setShowForgotPassword(true); // T29: Show resend option
        } else if (authError.message.includes('rate limit')) {
          setError('Too many login attempts. Please wait before trying again.');
          setRateLimitCooldown(60); // 1 minute cooldown for rate limiting
        } else {
          setError(authError.message);
        }
        return;
      }

      if (authData.user) {
        // Reset failed login attempts on successful login
        await updateFailedLoginAttempts(sanitizedEmail, false);
        
        // Update last login time in profiles table
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('user_id', authData.user.id);

        await logAuthEvent('sign_in_success', true, { email: sanitizedEmail });
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        
        onSignInComplete();
      }
    } catch (error: any) {
      await logAuthEvent('sign_in_error', false, { 
        email: data.email, 
        error: error.message 
      });
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // T5: Input sanitization function
  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>'"&]/g, ''); // T22: Basic XSS prevention
  };

  // Enhanced user existence check using comprehensive database function
  const checkUserExists = async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('check_user_exists', {
        user_email: email.toLowerCase()
      });

      if (error) {
        console.error('Error checking user existence:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return null;
    }
  };

  // Legacy function for backwards compatibility
  const checkExistingAccount = async (email: string): Promise<boolean> => {
    const userStatus = await checkUserExists(email);
    return (userStatus as unknown as UserExistenceStatus)?.exists || false;
  };

  const onSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // T5: Validate against whitespace-only input
      if (!data.email.trim() || !data.password.trim()) {
        setError('Email and password cannot be empty or contain only spaces.');
        return;
      }

      // T22, T23: Sanitize inputs to prevent XSS and injection
      const sanitizedEmail = sanitizeInput(data.email.trim().toLowerCase());
      
      // Enhanced user existence check before sending OTP
      const userStatus = await checkUserExists(sanitizedEmail);
      if (userStatus) {
        const status = userStatus as unknown as UserExistenceStatus;
        
        if (status.exists) {
          switch (status.status) {
            case 'complete':
              setError('Account already exists with this email address. Please sign in instead.');
              return;
              
            case 'unverified':
              setError('Account exists but email is not verified. Please check your email and verify your account first.');
              return;
              
            case 'partial_registration':
              setError('Account registration was incomplete. Please contact support for assistance.');
              return;
              
            default:
              setError('An account with this email already exists. Please sign in instead.');
              return;
          }
        }
      }

      // First, send OTP without creating the user in Supabase Auth yet
      console.log('Sending OTP code for email verification before user creation');
      
      try {
        // T27: Add timeout handling for slow connections
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        );

        const otpPromise = supabase.functions.invoke('send-otp', {
          body: {
            email: sanitizedEmail
          }
        });

        const { data: otpData, error: otpError } = await Promise.race([
          otpPromise,
          timeoutPromise
        ]) as any;

        if (otpError) {
          console.error('OTP send error:', otpError);
          
          // Handle specific error cases
          if (otpError.message?.includes('Too many OTP requests')) {
            setError('Too many verification attempts. Please wait an hour before trying again.');
          } else if (otpError.message?.includes('domain')) {
            setError('Email sending is currently under configuration. Please contact support.');
          } else {
            setError('Failed to send verification code. Please try again later.');
          }
          return;
        }

        if (otpData?.success) {
          // Store signup data temporarily for use after verification
          setUserEmail(sanitizedEmail);
          
          // Store password temporarily (we'll create the user after OTP verification)
          localStorage.setItem('pending_signup_data', JSON.stringify({
            email: sanitizedEmail,
            password: data.password
          }));
          
          toast({
            title: "Verification code sent!",
            description: "Please check your email for the verification code.",
          });
          setAuthState('email-check');
        } else {
          console.error('OTP send failed:', otpData);
          setError('Failed to send verification code. Please try again later.');
        }
      } catch (error: any) {
        console.error('OTP send error:', error);
        
        if (error.message === 'Request timeout') {
          setIsTimeout(true);
          setError('Request timed out. Please check your connection and try again.');
        } else {
          setError('Failed to send verification code. An error occurred. Please try again.');
        }
      }
    } catch (error: any) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        await logAuthEvent('google_auth_failed', false, { error: error.message });
        if (error.message.includes('OAuth state parameter missing')) {
          setError('Google authentication failed. Please try again or contact support if the issue persists.');
        } else {
          setError(error.message);
        }
      } else {
        await logAuthEvent('google_auth_initiated', true, {});
      }
    } catch (error: any) {
      await logAuthEvent('google_auth_error', false, { error: error.message });
      setError('Failed to sign in with Google. Please try again.');
      console.error('Google auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authState === 'email-check') {
    return (
      <OTPVerificationForm
        email={userEmail}
        onBack={() => {
          // Clear temporary data when going back
          localStorage.removeItem('pending_signup_data');
          setAuthState('auth');
        }}
        onVerify={async (otp: string) => {
          console.log('OTP verification successful for:', userEmail);
          
          // Get pending signup data
          const pendingData = localStorage.getItem('pending_signup_data');
          if (pendingData) {
            const { email, password } = JSON.parse(pendingData);
            
            try {
              // After OTP verification, create the user account
              const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  emailRedirectTo: `${window.location.origin}/dashboard`,
                  data: {
                    first_name: '',
                    last_name: '',
                  }
                }
              });

              if (authError) {
                console.error('User creation error after OTP:', authError);
                
                // Handle specific error cases
                if (authError.message.includes('User already registered')) {
                  // This shouldn't happen with our new validation, but just in case
                  toast({
                    title: "Account already exists",
                    description: "This email is already registered. Please sign in instead.",
                    variant: "destructive",
                  });
                } else {
                  toast({
                    title: "Account creation failed",
                    description: authError.message,
                    variant: "destructive",
                  });
                }
                setAuthState('auth');
                return;
              }

              if (authData.user) {
                // Clear the temporary data
                localStorage.removeItem('pending_signup_data');
                
                await logAuthEvent('sign_up_success', true, { email });
                console.log('User account created successfully after OTP verification');
                setAuthState('verified');
              }
            } catch (error: any) {
              console.error('Error creating user after OTP:', error);
              toast({
                title: "Account creation failed",
                description: "An error occurred while creating your account.",
                variant: "destructive",
              });
              setAuthState('auth');
            }
          } else {
            console.error('No pending signup data found');
            setAuthState('auth');
          }
        }}
        onResend={async () => {
          try {
            const { data, error } = await supabase.functions.invoke('send-otp', {
              body: {
                email: userEmail
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
          }
        }}
      />
    );
  }

  if (authState === 'verified') {
    return (
      <EmailVerified onContinue={onSignUpComplete} />
    );
  }

  // Show password update form in recovery mode
  if (isRecoveryMode) {
    return (
      <div className="flex-1 flex flex-col justify-center px-6 py-8 lg:px-8 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <PasswordUpdateForm onSuccess={() => {
            console.log('Password update completed');
            onPasswordUpdateComplete?.();
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8 lg:px-8 lg:w-1/2">
      <div className="mx-auto w-full max-w-sm">
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {rateLimitCooldown > 0 && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Please wait {rateLimitCooldown} seconds before trying again.
            </AlertDescription>
          </Alert>
        )}

        {/* T27: Show offline/timeout status */}
        {isOffline && (
          <Alert variant="destructive" className="mb-6">
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              You appear to be offline. Please check your internet connection.
            </AlertDescription>
          </Alert>
        )}

        {isTimeout && (
          <Alert variant="destructive" className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Request timed out. This might be due to a slow connection.{' '}
              <button 
                onClick={() => setIsTimeout(false)}
                className="underline font-medium"
              >
                Try again
              </button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-6">
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full h-11 flex items-center justify-center gap-3"
              >
                
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>
            
            <Form {...signInForm}>
              <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                <FormField
                  control={signInForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your email" 
                          className="h-11" 
                          disabled={isLoading}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={signInForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password" 
                            className="h-11 pr-10"
                            disabled={isLoading}
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <FormField
                    control={signInForm.control}
                    name="remember"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            Remember me
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <button 
                    type="button" 
                    className="text-sm text-primary hover:text-primary/80"
                    disabled={isLoading}
                    onClick={() => setForgotPasswordModalOpen(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                
                <Button 
                  type="submit"
                  disabled={isLoading || rateLimitCooldown > 0}
                  className="w-full h-11"
                >
                  {isLoading ? 'Signing in...' : rateLimitCooldown > 0 ? `Wait ${rateLimitCooldown}s` : 'Sign in'}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-6">
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full h-11 flex items-center justify-center gap-3"
              >
                
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or sign up with email</span>
              </div>
            </div>
            
            <Form {...signUpForm}>
              <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                
                <FormField
                  control={signUpForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your email" 
                          className="h-11" 
                          disabled={isLoading}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password" 
                            className="h-11 pr-10"
                            disabled={isLoading}
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Must contain at least 8 characters with uppercase, lowercase, number, and special character
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={signUpForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password" 
                            className="h-11 pr-10"
                            disabled={isLoading}
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isLoading}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={signUpForm.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          I accept the{' '}
                          <button type="button" className="text-primary hover:text-primary/80">
                            Terms of Service
                          </button>{' '}
                          and{' '}
                          <button type="button" className="text-primary hover:text-primary/80">
                            Privacy Policy
                          </button>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11"
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <ForgotPasswordModal 
          isOpen={forgotPasswordModalOpen}
          onClose={() => setForgotPasswordModalOpen(false)}
        />

        <AccountLockoutModal
          isOpen={lockoutModalOpen}
          onClose={() => setLockoutModalOpen(false)}
          lockoutData={lockoutData}
          userEmail={userEmail || signInForm.getValues('email')}
        />
      </div>
    </div>
  );
}
