import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Alert, AlertDescription } from '../ui/alert';
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdatePasswordComponentProps {
  onComplete: () => void;
}

const updatePasswordSchema = z.object({
  password: z.string()
    .min(1, 'Password is required')
    .min(12, 'Password must be at least 12 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export function UpdatePasswordComponent({ onComplete }: UpdatePasswordComponentProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: UpdatePasswordFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      toast({
        title: "Password updated successfully!",
        description: "Your password has been reset. You are now signed in.",
      });
      
      // Redirect to dashboard after successful password update
      onComplete();
    } catch (error: any) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 12,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    Object.values(checks).forEach(check => {
      if (check) score++;
    });

    return { score, checks };
  };

  const passwordValue = form.watch('password');
  const { score, checks } = getPasswordStrength(passwordValue || '');

  const getStrengthColor = () => {
    if (score <= 2) return 'bg-destructive';
    if (score <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Update your password
          </h1>
          <p className="text-muted-foreground">
            Enter your new password below. Make sure it's strong and secure.
          </p>
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your new password"
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
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  
                  {passwordValue && (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Password strength:</span>
                        <span className={`text-xs font-medium ${score <= 2 ? 'text-destructive' : score <= 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {getStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${getStrengthColor()}`}
                          style={{ width: `${(score / 5) * 100}%` }}
                        />
                      </div>
                      <div className="space-y-1">
                        {Object.entries(checks).map(([key, passed]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <CheckCircle className={`h-3 w-3 ${passed ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <span className={`text-xs ${passed ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {key === 'length' && 'At least 12 characters'}
                              {key === 'lowercase' && 'One lowercase letter'}
                              {key === 'uppercase' && 'One uppercase letter'}
                              {key === 'number' && 'One number'}
                              {key === 'special' && 'One special character'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
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
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || score < 5}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}