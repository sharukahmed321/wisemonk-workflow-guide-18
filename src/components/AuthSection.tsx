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
import { Eye, EyeOff, Shield, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthSectionProps {
  onSignInComplete: () => void;
  onSignUpComplete: () => void;
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

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export function AuthSection({ onSignInComplete, onSignUpComplete }: AuthSectionProps) {
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
      // First check if account is locked
      const securityStatus = await checkAccountSecurity(data.email);
      if (securityStatus?.is_locked) {
        setLockoutData(securityStatus);
        setLockoutModalOpen(true);
        setIsLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        await logAuthEvent('sign_in_failed', false, { 
          email: data.email, 
          error: authError.message 
        });
        
        if (authError.message.includes('Invalid login credentials')) {
          await updateFailedLoginAttempts(data.email, true);
          setError('Invalid email or password. Please check your credentials and try again.');
          
          // Add rate limiting for repeated failures
          setRateLimitCooldown(5); // 5 second cooldown after failed attempt
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in.');
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
        await updateFailedLoginAttempts(data.email, false);
        
        // Update last login time in profiles table
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('user_id', authData.user.id);

        await logAuthEvent('sign_in_success', true, { email: data.email });
        
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

  const onSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: '',
            last_name: '',
          }
        }
      });

      if (authError) {
        await logAuthEvent('sign_up_failed', false, { 
          email: data.email, 
          error: authError.message 
        });
        
        if (authError.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (authData.user) {
        await logAuthEvent('sign_up_success', true, { email: data.email });
        
        setUserEmail(data.email);
        
        // Send OTP code via edge function
        console.log('User created successfully, sending OTP code');
        
        try {
          const { data: otpData, error: otpError } = await supabase.functions.invoke('send-otp', {
            body: {
              email: data.email
            }
          });

          if (otpError) {
            console.error('OTP send error:', otpError);
            toast({
              title: "OTP Send Failed",
              description: "Failed to send verification code. Please try again.",
              variant: "destructive",
            });
            return;
          }

          if (otpData?.success) {
            toast({
              title: "Account created!",
              description: "Please check your email for the verification code.",
            });
            setAuthState('email-check');
          } else {
            console.error('OTP send failed:', otpData);
            toast({
              title: "OTP Send Failed", 
              description: "Failed to send verification code. Please try again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('OTP send error:', error);
          toast({
            title: "OTP Send Failed",
            description: "Failed to send verification code. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      await logAuthEvent('sign_up_error', false, { 
        email: data.email, 
        error: error.message 
      });
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
        onBack={() => setAuthState('auth')}
        onVerify={(otp: string) => {
          console.log('OTP verification initiated for:', userEmail);
          setAuthState('verified');
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
                  {showForgotPassword && (
                    <button 
                      type="button" 
                      className="text-sm text-primary hover:text-primary/80"
                      disabled={isLoading}
                      onClick={() => setForgotPasswordModalOpen(true)}
                    >
                      Forgot password?
                    </button>
                  )}
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
                        Must contain at least 12 characters with uppercase, lowercase, number, and special character
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
