import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SignupData {
  email: string;
  password: string;
}

interface UseSecureSignupReturn {
  storeSignupData: (data: SignupData) => void;
  retrieveSignupData: () => SignupData | null;
  clearSignupData: () => void;
  completeUserCreation: () => Promise<{ success: boolean; error?: string }>;
}

/**
 * Secure signup hook that avoids storing passwords in localStorage
 * Uses in-memory storage for security-sensitive data
 */
export function useSecureSignup(): UseSecureSignupReturn {
  const [signupData, setSignupData] = useState<SignupData | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Security: Clear sensitive data after 10 minutes
  useEffect(() => {
    return () => {
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    };
  }, [sessionTimeout]);

  const storeSignupData = (data: SignupData) => {
    // Store in secure in-memory state instead of localStorage
    setSignupData(data);
    
    // Clear data after 10 minutes for security
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    
    const timeout = setTimeout(() => {
      setSignupData(null);
      toast({
        title: "Session Expired",
        description: "For security, your signup session has expired. Please try again.",
        variant: "destructive",
      });
    }, 10 * 60 * 1000); // 10 minutes
    
    setSessionTimeout(timeout);
  };

  const retrieveSignupData = (): SignupData | null => {
    return signupData;
  };

  const clearSignupData = () => {
    setSignupData(null);
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
  };

  const completeUserCreation = async (): Promise<{ success: boolean; error?: string }> => {
    if (!signupData) {
      return { success: false, error: 'No signup data found. Please restart the signup process.' };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        console.error('User creation error:', authError);
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        // Clear sensitive data immediately after successful creation
        clearSignupData();
        return { success: true };
      } else {
        return { success: false, error: 'User creation failed' };
      }
    } catch (error: any) {
      console.error('User creation error:', error);
      return { success: false, error: 'An unexpected error occurred during account creation' };
    }
  };

  return {
    storeSignupData,
    retrieveSignupData,
    clearSignupData,
    completeUserCreation,
  };
}