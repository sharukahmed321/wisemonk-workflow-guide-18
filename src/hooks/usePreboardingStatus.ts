import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface EmployeeData {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  status: string;
  start_date: string;
}

interface OnboardingProgress {
  basic_info_completed: boolean;
  company_info_completed: boolean;
  address_completed: boolean;
  msa_completed: boolean;
}

interface PreboardingStatus {
  needsPreboarding: boolean;
  progress: number;
  employee: EmployeeData | null;
  shouldHideOrgContent: boolean;
  dueDate: Date | null;
  loading: boolean;
  error: string | null;
}

export function usePreboardingStatus(): PreboardingStatus {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEmployeeAndProgress();
    }
  }, [user]);

  const fetchEmployeeAndProgress = async () => {
    try {
      setLoading(true);
      
      // Fetch employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, status, start_date')
        .eq('user_id', user?.id)
        .single();

      if (employeeError && employeeError.code !== 'PGRST116') {
        throw employeeError;
      }

      // Fetch onboarding progress from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('basic_info_completed, company_info_completed, address_completed, msa_completed')
        .eq('user_id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setEmployee(employeeData);
      setOnboardingProgress(profileData);
      
    } catch (err) {
      console.error('Error fetching employee and progress data:', err);
      setError('Failed to load employee information.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    if (!onboardingProgress) return 0;
    
    const steps = [
      onboardingProgress.basic_info_completed,
      onboardingProgress.company_info_completed,
      onboardingProgress.address_completed,
      onboardingProgress.msa_completed
    ];
    
    const completedSteps = steps.filter(Boolean).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  // Calculate due date (start date + 7 days)
  const calculateDueDate = (): Date | null => {
    if (!employee?.start_date) return null;
    
    const startDate = new Date(employee.start_date);
    const dueDate = new Date(startDate);
    dueDate.setDate(startDate.getDate() + 7);
    return dueDate;
  };

  // Determine if employee needs preboarding
  const needsPreboarding = employee?.status === 'Invited' || employee?.status === 'Preboarding';
  
  // Hide org content for employees in preboarding status
  const shouldHideOrgContent = needsPreboarding;
  
  const progress = calculateProgress();
  const dueDate = calculateDueDate();

  return {
    needsPreboarding,
    progress,
    employee,
    shouldHideOrgContent,
    dueDate,
    loading,
    error
  };
}