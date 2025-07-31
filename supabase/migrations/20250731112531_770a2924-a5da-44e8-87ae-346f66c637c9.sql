-- Make user_id nullable in profiles table to support pre-registered employees
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Update handle_new_user function to properly handle pre-registered profiles with null user_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  existing_profile_id uuid;
  existing_org_id uuid;
BEGIN
  -- Check if a pre-registered profile exists with this email and null user_id
  SELECT id, organization_id INTO existing_profile_id, existing_org_id
  FROM public.profiles 
  WHERE email = NEW.email AND is_pre_registered = true AND user_id IS NULL;
  
  IF existing_profile_id IS NOT NULL THEN
    -- Update the existing pre-registered profile with the new user_id
    UPDATE public.profiles 
    SET 
      user_id = NEW.id,
      is_pre_registered = false,
      first_name = COALESCE(NEW.raw_user_meta_data ->> 'first_name', first_name),
      last_name = COALESCE(NEW.raw_user_meta_data ->> 'last_name', last_name),
      updated_at = now()
    WHERE id = existing_profile_id;
    
    -- Create user_roles record for the new user with organization_id
    INSERT INTO public.user_roles (user_id, role, organization_id, assigned_at)
    VALUES (NEW.id, 'employee', existing_org_id, now());
    
    -- Log the conversion event
    INSERT INTO public.auth_audit_logs (user_id, event_type, success, details)
    VALUES (
      NEW.id,
      'pre_registered_user_signup',
      true,
      jsonb_build_object(
        'email', NEW.email, 
        'organization_id', existing_org_id,
        'converted_from_pre_registration', true
      )
    );
  ELSE
    -- Standard new user flow - create new profile
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
      msa_status,
      is_pre_registered
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
      'pending',
      false
    );
    
    -- Only assign client role if user has no existing roles
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'client');
    END IF;
    
    -- Log the standard signup event
    INSERT INTO public.auth_audit_logs (user_id, event_type, success, details)
    VALUES (
      NEW.id,
      'user_signup',
      true,
      jsonb_build_object('email', NEW.email, 'signup_method', 'email')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update RLS policies to handle null user_id for pre-registered profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR (user_id IS NULL AND is_pre_registered = true));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow viewing pre-registered profiles for organization members
CREATE POLICY "Organization members can view pre-registered profiles" 
ON public.profiles 
FOR SELECT 
USING (
  is_pre_registered = true 
  AND user_id IS NULL 
  AND organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);