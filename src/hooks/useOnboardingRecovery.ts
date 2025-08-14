import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingRecovery {
  needsRecovery: boolean;
  currentStep: number;
  progressData: {
    hasPersonalInfo: boolean;
    hasOrganization: boolean;
    completionStatus: boolean;
  };
  loading: boolean;
}

export function useOnboardingRecovery(userId: string | undefined): OnboardingRecovery {
  const [recovery, setRecovery] = useState<OnboardingRecovery>({
    needsRecovery: false,
    currentStep: 1,
    progressData: {
      hasPersonalInfo: false,
      hasOrganization: false,
      completionStatus: false,
    },
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setRecovery(prev => ({ ...prev, loading: false }));
      return;
    }

    checkOnboardingProgress();
  }, [userId]);

  const checkOnboardingProgress = async () => {
    try {
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, job_title, organization_id, onboarding_completed, onboarding_step')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking profile for recovery:', profileError);
        setRecovery(prev => ({ ...prev, loading: false }));
        return;
      }

      // Check if organization exists
      let hasOrganization = false;
      if (profile?.organization_id) {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('id', profile.organization_id)
          .single();
          
        hasOrganization = !orgError && !!org;
      }

      const hasPersonalInfo = !!(profile?.first_name && profile?.last_name && profile?.job_title);
      const isCompleted = profile?.onboarding_completed || false;
      
      // Determine if recovery is needed and current step
      let needsRecovery = false;
      let currentStep = 1;

      if (!isCompleted) {
        if (hasPersonalInfo && hasOrganization) {
          // User completed both steps but didn't finish final step
          needsRecovery = true;
          currentStep = 3;
        } else if (hasPersonalInfo && !hasOrganization) {
          // User completed step 1 but not step 2
          needsRecovery = true;
          currentStep = 2;
        } else if (!hasPersonalInfo) {
          // User didn't complete step 1
          currentStep = 1;
        }
      }

      setRecovery({
        needsRecovery,
        currentStep,
        progressData: {
          hasPersonalInfo,
          hasOrganization,
          completionStatus: isCompleted,
        },
        loading: false,
      });
    } catch (error) {
      console.error('Error in onboarding recovery check:', error);
      setRecovery(prev => ({ ...prev, loading: false }));
    }
  };

  return recovery;
}