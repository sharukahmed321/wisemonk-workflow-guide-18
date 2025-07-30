import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, AlertCircle, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResetPasswordComponentProps {
  onComplete: () => void;
}

const resetPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform(val => val.trim().toLowerCase()),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordComponent({ onComplete }: ResetPasswordComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth?mode=update-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Password reset sent!",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    onComplete();
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Check your email
              </h1>
              <p className="text-muted-foreground">
                We've sent a password reset link to your email address. 
                Click the link in the email to reset your password.
              </p>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Password reset instructions have been sent to your email address.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button onClick={handleBackToSignIn} className="w-full">
              Back to sign in
            </Button>
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or{' '}
              <button 
                onClick={() => setIsSuccess(false)}
                className="text-primary hover:underline"
              >
                try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <Link
            to="/auth?mode=sign-in"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Reset your password
            </h1>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your email" 
                      disabled={isLoading}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Remember your password? </span>
          <Link to="/auth?mode=sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}