-- Update the trigger function to better handle MSA completion status
CREATE OR REPLACE FUNCTION public.update_onboarding_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Check and update basic info completion
  IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL AND NEW.job_title IS NOT NULL THEN
    NEW.basic_info_completed = true;
    NEW.basic_info_status = 'completed';
    IF OLD.basic_info_completed = false OR OLD.basic_info_completed IS NULL THEN
      NEW.basic_info_completed_at = now();
    END IF;
  ELSE
    NEW.basic_info_completed = false;
    NEW.basic_info_status = 'pending';
    NEW.basic_info_completed_at = NULL;
  END IF;

  -- Check and update company info completion (now checks organizations table)
  IF NEW.organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = NEW.organization_id 
      AND name IS NOT NULL 
      AND legal_name IS NOT NULL 
      AND country IS NOT NULL 
      AND employee_count IS NOT NULL
  ) THEN
    NEW.company_info_completed = true;
    NEW.company_info_status = 'completed';
    IF OLD.company_info_completed = false OR OLD.company_info_completed IS NULL THEN
      NEW.company_info_completed_at = now();
    END IF;
  ELSE
    NEW.company_info_completed = false;
    NEW.company_info_status = 'pending';
    NEW.company_info_completed_at = NULL;
  END IF;

  -- Check and update address completion (now checks organizations table)
  IF NEW.organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = NEW.organization_id 
      AND business_address IS NOT NULL 
      AND business_city IS NOT NULL 
      AND business_state IS NOT NULL 
      AND business_postal_code IS NOT NULL
  ) THEN
    NEW.address_completed = true;
    NEW.address_status = 'completed';
    IF OLD.address_completed = false OR OLD.address_completed IS NULL THEN
      NEW.address_completed_at = now();
    END IF;
  ELSE
    NEW.address_completed = false;
    NEW.address_status = 'pending';
    NEW.address_completed_at = NULL;
  END IF;

  -- Check and update MSA completion - Enhanced logic
  IF NEW.msa_signed = true OR NEW.msa_completed = true THEN
    NEW.msa_completed = true;
    NEW.msa_status = 'completed';
    IF OLD.msa_completed = false OR OLD.msa_completed IS NULL THEN
      NEW.msa_completed_at = now();
    END IF;
  ELSE
    -- Keep existing values if MSA was previously completed but not signed
    IF OLD.msa_completed = true THEN
      NEW.msa_completed = true;
      NEW.msa_status = 'completed';
    ELSE
      NEW.msa_completed = false;
      NEW.msa_status = 'pending';
      NEW.msa_completed_at = NULL;
    END IF;
  END IF;

  -- Check overall setup completion - New flexible logic
  -- Setup is complete when basic_info AND address AND (msa OR first_employee) are done
  -- We check for employees by looking at the organization
  DECLARE
    has_employees boolean := false;
  BEGIN
    IF NEW.organization_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM public.employees 
        WHERE organization_id = NEW.organization_id
        LIMIT 1
      ) INTO has_employees;
    END IF;

    -- Flexible completion: basic + address + (msa OR employees)
    IF NEW.basic_info_completed = true 
       AND NEW.company_info_completed = true 
       AND NEW.address_completed = true 
       AND (NEW.msa_completed = true OR has_employees = true) THEN
      NEW.setup_completed = true;
      IF OLD.setup_completed = false OR OLD.setup_completed IS NULL THEN
        NEW.setup_completed_at = now();
      END IF;
      
      -- Update user roles with organization_id when onboarding is completed
      IF (OLD.setup_completed = false OR OLD.setup_completed IS NULL) AND NEW.organization_id IS NOT NULL THEN
        -- Update existing user roles to include organization_id
        UPDATE public.user_roles 
        SET organization_id = NEW.organization_id,
            assigned_at = now()
        WHERE user_id = NEW.user_id 
          AND organization_id IS NULL;
        
        -- If user is the organization creator, upgrade their role to manager
        IF EXISTS (
          SELECT 1 FROM public.organizations 
          WHERE id = NEW.organization_id 
            AND created_by = NEW.user_id
        ) THEN
          -- Update role from client to manager for organization creator
          UPDATE public.user_roles 
          SET role = 'manager'::app_role,
              assigned_at = now()
          WHERE user_id = NEW.user_id 
            AND role = 'client'::app_role;
        END IF;
      END IF;
    ELSE
      NEW.setup_completed = false;
      NEW.setup_completed_at = NULL;
    END IF;
  END;

  RETURN NEW;
END;
$function$;

-- Add logging function for MSA completion events
CREATE OR REPLACE FUNCTION public.log_msa_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Log when MSA completion status changes
  IF NEW.msa_completed != OLD.msa_completed OR NEW.msa_signed != OLD.msa_signed THEN
    INSERT INTO public.auth_audit_logs (
      user_id, 
      event_type, 
      details,
      success,
      created_at
    ) VALUES (
      NEW.user_id,
      'msa_status_change',
      json_build_object(
        'old_msa_completed', OLD.msa_completed,
        'new_msa_completed', NEW.msa_completed,
        'old_msa_signed', OLD.msa_signed,
        'new_msa_signed', NEW.msa_signed,
        'timestamp', now()
      ),
      true,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for MSA completion logging
DROP TRIGGER IF EXISTS log_msa_completion_trigger ON public.profiles;
CREATE TRIGGER log_msa_completion_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_msa_completion();