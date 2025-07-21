
-- Add organization_id column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON public.user_roles(organization_id);

-- Update the onboarding status function to also handle role assignments
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

  -- Check and update MSA completion
  IF NEW.msa_signed = true THEN
    NEW.msa_completed = true;
    NEW.msa_status = 'completed';
    IF OLD.msa_completed = false OR OLD.msa_completed IS NULL THEN
      NEW.msa_completed_at = now();
    END IF;
  ELSE
    NEW.msa_completed = false;
    NEW.msa_status = 'pending';
    NEW.msa_completed_at = NULL;
  END IF;

  -- Check overall setup completion
  IF NEW.basic_info_completed = true AND NEW.company_info_completed = true AND NEW.address_completed = true AND NEW.msa_completed = true THEN
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

  RETURN NEW;
END;
$function$;

-- Create function to assign organization roles for completed onboarding
CREATE OR REPLACE FUNCTION public.assign_organization_role(p_user_id uuid, p_organization_id uuid, p_role app_role DEFAULT 'employee'::app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update existing role record with organization_id
  UPDATE public.user_roles 
  SET organization_id = p_organization_id,
      role = p_role,
      assigned_at = now()
  WHERE user_id = p_user_id;
  
  -- If no role exists, insert a new one
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (p_user_id, p_role, p_organization_id);
  END IF;
END;
$function$;
