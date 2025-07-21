
-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  country TEXT NOT NULL,
  employee_count employee_count_range NOT NULL,
  business_address TEXT,
  business_city TEXT,
  business_state TEXT,
  business_postal_code TEXT,
  website TEXT,
  phone TEXT,
  industry TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add organization_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Migrate existing organization data from profiles to organizations
INSERT INTO public.organizations (
  name, 
  legal_name, 
  country, 
  employee_count, 
  business_address, 
  business_city, 
  business_state, 
  business_postal_code,
  created_by
)
SELECT DISTINCT
  company_name,
  company_legal_name,
  country,
  employee_count,
  business_address,
  business_city,
  business_state,
  business_postal_code,
  user_id
FROM public.profiles 
WHERE company_name IS NOT NULL 
  AND company_legal_name IS NOT NULL 
  AND country IS NOT NULL 
  AND employee_count IS NOT NULL;

-- Update profiles with organization_id references
UPDATE public.profiles 
SET organization_id = org.id
FROM public.organizations org
WHERE profiles.company_name = org.name 
  AND profiles.company_legal_name = org.legal_name
  AND profiles.country = org.country
  AND profiles.employee_count = org.employee_count
  AND profiles.user_id = org.created_by;

-- Remove organization columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS company_name,
DROP COLUMN IF EXISTS company_legal_name,
DROP COLUMN IF EXISTS country,
DROP COLUMN IF EXISTS employee_count,
DROP COLUMN IF EXISTS business_address,
DROP COLUMN IF EXISTS business_city,
DROP COLUMN IF EXISTS business_state,
DROP COLUMN IF EXISTS business_postal_code;

-- Add updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- RLS policies for organizations
CREATE POLICY "Users can view their own organization" 
  ON public.organizations 
  FOR SELECT 
  USING (
    id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations" 
  ON public.organizations 
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Organization creators can update their organization" 
  ON public.organizations 
  FOR UPDATE 
  USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all organizations" 
  ON public.organizations 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update the onboarding status function to work with organizations
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
  ELSE
    NEW.setup_completed = false;
    NEW.setup_completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$function$;

-- Update the get_onboarding_progress function to include organization data
CREATE OR REPLACE FUNCTION public.get_onboarding_progress(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  progress_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', p.user_id,
    'basic_info', jsonb_build_object(
      'completed', COALESCE(p.basic_info_completed, false),
      'completed_at', p.basic_info_completed_at,
      'status', COALESCE(p.basic_info_status, 'pending'),
      'data', jsonb_build_object(
        'first_name', p.first_name,
        'last_name', p.last_name,
        'job_title', p.job_title
      )
    ),
    'company_info', jsonb_build_object(
      'completed', COALESCE(p.company_info_completed, false),
      'completed_at', p.company_info_completed_at,
      'status', COALESCE(p.company_info_status, 'pending'),
      'data', jsonb_build_object(
        'company_name', o.name,
        'company_legal_name', o.legal_name,
        'country', o.country,
        'employee_count', o.employee_count
      )
    ),
    'address_info', jsonb_build_object(
      'completed', COALESCE(p.address_completed, false),
      'completed_at', p.address_completed_at,
      'status', COALESCE(p.address_status, 'pending'),
      'data', jsonb_build_object(
        'business_address', o.business_address,
        'business_city', o.business_city,
        'business_state', o.business_state,
        'business_postal_code', o.business_postal_code
      )
    ),
    'msa_info', jsonb_build_object(
      'completed', COALESCE(p.msa_completed, false),
      'completed_at', p.msa_completed_at,
      'status', COALESCE(p.msa_status, 'pending'),
      'data', jsonb_build_object(
        'msa_signed', COALESCE(p.msa_signed, false),
        'msa_signed_at', p.msa_signed_at,
        'msa_signed_by', p.msa_signed_by
      )
    ),
    'overall_progress', jsonb_build_object(
      'setup_completed', COALESCE(p.setup_completed, false),
      'setup_completed_at', p.setup_completed_at,
      'completion_percentage', 
        CASE 
          WHEN COALESCE(p.basic_info_completed, false) AND COALESCE(p.company_info_completed, false) AND COALESCE(p.address_completed, false) AND COALESCE(p.msa_completed, false) THEN 100
          WHEN (COALESCE(p.basic_info_completed, false)::int + COALESCE(p.company_info_completed, false)::int + COALESCE(p.address_completed, false)::int + COALESCE(p.msa_completed, false)::int) > 0 THEN 
            (COALESCE(p.basic_info_completed, false)::int + COALESCE(p.company_info_completed, false)::int + COALESCE(p.address_completed, false)::int + COALESCE(p.msa_completed, false)::int) * 25
          ELSE 0
        END
    ),
    'organization', CASE 
      WHEN o.id IS NOT NULL THEN jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'legal_name', o.legal_name,
        'country', o.country,
        'employee_count', o.employee_count,
        'business_address', o.business_address,
        'business_city', o.business_city,
        'business_state', o.business_state,
        'business_postal_code', o.business_postal_code,
        'website', o.website,
        'phone', o.phone,
        'industry', o.industry,
        'description', o.description
      )
      ELSE NULL
    END
  ) INTO progress_data
  FROM public.profiles p
  LEFT JOIN public.organizations o ON p.organization_id = o.id
  WHERE p.user_id = user_id_param;

  RETURN COALESCE(progress_data, '{}'::jsonb);
END;
$function$;

-- Create function to create or update organization
CREATE OR REPLACE FUNCTION public.upsert_organization(
  p_organization_id UUID DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_legal_name TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_employee_count employee_count_range DEFAULT NULL,
  p_business_address TEXT DEFAULT NULL,
  p_business_city TEXT DEFAULT NULL,
  p_business_state TEXT DEFAULT NULL,
  p_business_postal_code TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_industry TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_organization_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- If organization_id is provided, update existing organization
  IF p_organization_id IS NOT NULL THEN
    UPDATE public.organizations 
    SET 
      name = COALESCE(p_name, name),
      legal_name = COALESCE(p_legal_name, legal_name),
      country = COALESCE(p_country, country),
      employee_count = COALESCE(p_employee_count, employee_count),
      business_address = COALESCE(p_business_address, business_address),
      business_city = COALESCE(p_business_city, business_city),
      business_state = COALESCE(p_business_state, business_state),
      business_postal_code = COALESCE(p_business_postal_code, business_postal_code),
      website = COALESCE(p_website, website),
      phone = COALESCE(p_phone, phone),
      industry = COALESCE(p_industry, industry),
      description = COALESCE(p_description, description),
      updated_at = now()
    WHERE id = p_organization_id
      AND (created_by = v_user_id OR has_role(v_user_id, 'admin'::app_role))
    RETURNING id INTO v_organization_id;
    
    IF v_organization_id IS NULL THEN
      RAISE EXCEPTION 'Organization not found or access denied';
    END IF;
  ELSE
    -- Create new organization
    INSERT INTO public.organizations (
      name, legal_name, country, employee_count,
      business_address, business_city, business_state, business_postal_code,
      website, phone, industry, description, created_by
    ) VALUES (
      p_name, p_legal_name, p_country, p_employee_count,
      p_business_address, p_business_city, p_business_state, p_business_postal_code,
      p_website, p_phone, p_industry, p_description, v_user_id
    ) RETURNING id INTO v_organization_id;
    
    -- Link the organization to the user's profile
    UPDATE public.profiles 
    SET organization_id = v_organization_id
    WHERE user_id = v_user_id;
  END IF;

  RETURN v_organization_id;
END;
$function$;
