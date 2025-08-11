import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Alert, AlertDescription } from "./ui/alert";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PasswordUpdateFormProps {
  onSuccess: () => void;
}

const passwordUpdateSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])/, 'Password must contain lowercase letters')
    .regex(/^(?=.*[A-Z])/, 'Password must contain uppercase letters')
    .regex(/^(?=.*\d)/, 'Password must contain numbers')
    .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, 'Password must contain special characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordUpdateFormData = z.infer<typeof passwordUpdateSchema>;

export function PasswordUpdateForm({ onSuccess }: PasswordUpdateFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const strength = passedChecks === 5 ? 'Strong' : passedChecks >= 3 ? 'Good' : passedChecks >= 2 ? 'Fair' : 'Weak';
    
    return { checks, strength, score: passedChecks };
  };

  const form = useForm<PasswordUpdateFormData>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordUpdateFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Updating password...');
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        setError(updateError.message);
        return;
      }

      console.log('Password updated successfully');
      
      // Sign out user to force login with new password
      await supabase.auth.signOut();
      
      toast({
        title: "Password updated!",
        description: "Please log in with your new password.",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Unexpected error updating password:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">Update Your Password</h2>
        <p className="text-muted-foreground mt-2">
          Please enter a new password for your account
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
            render={({ field }) => {
              const passwordStrength = checkPasswordStrength(field.value || '');
              return (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
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
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  
                  {field.value && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Password Strength:</span>
                        <span className={`text-sm font-medium ${
                          passwordStrength.strength === 'Strong' ? 'text-green-600' :
                          passwordStrength.strength === 'Good' ? 'text-blue-600' :
                          passwordStrength.strength === 'Fair' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {passwordStrength.strength}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            passwordStrength.strength === 'Strong' ? 'bg-green-600' :
                            passwordStrength.strength === 'Good' ? 'bg-blue-600' :
                            passwordStrength.strength === 'Fair' ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}`}>
                          {passwordStrength.checks.length ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          At least 8 characters
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                          {passwordStrength.checks.lowercase ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          Lowercase letters
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                          {passwordStrength.checks.uppercase ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          Uppercase letters
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}`}>
                          {passwordStrength.checks.number ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          Numbers
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.checks.special ? 'text-green-600' : 'text-gray-400'}`}>
                          {passwordStrength.checks.special ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          Special characters
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
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
                      tabIndex={-1}
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
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>
      </Form>
    </div>
  );
}