
-- Create enums for standardized values
CREATE TYPE public.employee_count_range AS ENUM (
  '1-10',
  '11-50', 
  '51-200',
  '201-500',
  '501-1000',
  '1000+'
);

CREATE TYPE public.setup_step_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'skipped'
);

-- Add new columns to profiles table for onboarding and organization data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_legal_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_count employee_count_range;

-- Business address fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_state text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_postal_code text;

-- Onboarding completion tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS basic_info_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS basic_info_completed_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_info_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_info_completed_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_completed_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS msa_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS msa_completed_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS setup_completed_at timestamp with time zone;

-- MSA signature details
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS msa_signed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS msa_signed_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS msa_signed_by text;

-- Step status tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS basic_info_status setup_step_status DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_info_status setup_step_status DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_status setup_step_status DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS msa_status setup_step_status DEFAULT 'pending';

-- Create function to automatically update onboarding status
CREATE OR REPLACE FUNCTION public.update_onboarding_status()
RETURNS TRIGGER AS $$
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

  -- Check and update company info completion
  IF NEW.company_name IS NOT NULL AND NEW.company_legal_name IS NOT NULL AND NEW.country IS NOT NULL AND NEW.employee_count IS NOT NULL THEN
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

  -- Check and update address completion
  IF NEW.business_address IS NOT NULL AND NEW.business_city IS NOT NULL AND NEW.business_state IS NOT NULL AND NEW.business_postal_code IS NOT NULL THEN
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
  ELSE
    NEW.setup_completed = false;
    NEW.setup_completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update onboarding status
DROP TRIGGER IF EXISTS update_onboarding_status_trigger ON public.profiles;
CREATE TRIGGER update_onboarding_status_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_onboarding_status();

-- Create function to get onboarding progress
CREATE OR REPLACE FUNCTION public.get_onboarding_progress(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  progress_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', user_id,
    'basic_info', jsonb_build_object(
      'completed', COALESCE(basic_info_completed, false),
      'completed_at', basic_info_completed_at,
      'status', COALESCE(basic_info_status, 'pending'),
      'data', jsonb_build_object(
        'first_name', first_name,
        'last_name', last_name,
        'job_title', job_title
      )
    ),
    'company_info', jsonb_build_object(
      'completed', COALESCE(company_info_completed, false),
      'completed_at', company_info_completed_at,
      'status', COALESCE(company_info_status, 'pending'),
      'data', jsonb_build_object(
        'company_name', company_name,
        'company_legal_name', company_legal_name,
        'country', country,
        'employee_count', employee_count
      )
    ),
    'address_info', jsonb_build_object(
      'completed', COALESCE(address_completed, false),
      'completed_at', address_completed_at,
      'status', COALESCE(address_status, 'pending'),
      'data', jsonb_build_object(
        'business_address', business_address,
        'business_city', business_city,
        'business_state', business_state,
        'business_postal_code', business_postal_code
      )
    ),
    'msa_info', jsonb_build_object(
      'completed', COALESCE(msa_completed, false),
      'completed_at', msa_completed_at,
      'status', COALESCE(msa_status, 'pending'),
      'data', jsonb_build_object(
        'msa_signed', COALESCE(msa_signed, false),
        'msa_signed_at', msa_signed_at,
        'msa_signed_by', msa_signed_by
      )
    ),
    'overall_progress', jsonb_build_object(
      'setup_completed', COALESCE(setup_completed, false),
      'setup_completed_at', setup_completed_at,
      'completion_percentage', 
        CASE 
          WHEN COALESCE(basic_info_completed, false) AND COALESCE(company_info_completed, false) AND COALESCE(address_completed, false) AND COALESCE(msa_completed, false) THEN 100
          WHEN (COALESCE(basic_info_completed, false)::int + COALESCE(company_info_completed, false)::int + COALESCE(address_completed, false)::int + COALESCE(msa_completed, false)::int) > 0 THEN 
            (COALESCE(basic_info_completed, false)::int + COALESCE(company_info_completed, false)::int + COALESCE(address_completed, false)::int + COALESCE(msa_completed, false)::int) * 25
          ELSE 0
        END
    )
  ) INTO progress_data
  FROM public.profiles
  WHERE user_id = user_id_param;

  RETURN COALESCE(progress_data, '{}'::jsonb);
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_status ON public.profiles(user_id, setup_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_basic_info_completed ON public.profiles(basic_info_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_company_info_completed ON public.profiles(company_info_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_address_completed ON public.profiles(address_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_msa_completed ON public.profiles(msa_completed);

-- Update the handle_new_user function to initialize onboarding fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insert into profiles with onboarding fields initialized
  INSERT INTO public.profiles (
    user_id, 
    email, 
    first_name, 
    last_name,
    basic_info_completed,
    company_info_completed,
    address_completed,
    msa_completed,
    setup_completed,
    basic_info_status,
    company_info_status,
    address_status,
    msa_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    false,
    false,
    false,
    false,
    false,
    'pending',
    'pending',
    'pending',
    'pending'
  );
  
  -- Only assign client role if user has no existing roles
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client');
  END IF;
  
  -- Log the signup event
  INSERT INTO public.auth_audit_logs (user_id, event_type, success, details)
  VALUES (
    NEW.id,
    'user_signup',
    true,
    jsonb_build_object('email', NEW.email, 'signup_method', 'email')
  );
  
  RETURN NEW;
END;
$$;

-- Update existing profiles to have default onboarding values
UPDATE public.profiles 
SET 
  basic_info_completed = COALESCE(basic_info_completed, false),
  company_info_completed = COALESCE(company_info_completed, false),
  address_completed = COALESCE(address_completed, false),
  msa_completed = COALESCE(msa_completed, false),
  setup_completed = COALESCE(setup_completed, false),
  basic_info_status = COALESCE(basic_info_status, 'pending'),
  company_info_status = COALESCE(company_info_status, 'pending'),
  address_status = COALESCE(address_status, 'pending'),
  msa_status = COALESCE(msa_status, 'pending')
WHERE 
  basic_info_completed IS NULL OR 
  company_info_completed IS NULL OR 
  address_completed IS NULL OR 
  msa_completed IS NULL OR 
  setup_completed IS NULL OR
  basic_info_status IS NULL OR
  company_info_status IS NULL OR
  address_status IS NULL OR
  msa_status IS NULL;

-- Trigger the update function on existing records to set proper completion status
UPDATE public.profiles SET updated_at = now();
