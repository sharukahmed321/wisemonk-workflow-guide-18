-- Fix role assignment issue: new users should get 'client' role, not 'manager'
-- Update handle_new_user function to ensure correct default role assignment

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    
    -- Update ALL matching user_roles records with the new user_id
    UPDATE public.user_roles 
    SET user_id = NEW.id,
        assigned_at = now()
    WHERE user_id IS NULL 
      AND organization_id = existing_org_id
      AND role = 'employee';
    
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
    
    -- FIXED: Always assign 'client' role to new users (not 'manager')
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client');
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Also clean up any existing incorrect 'manager' roles that should be 'client'
-- Only update roles that were assigned recently and don't have an organization_id
UPDATE public.user_roles 
SET role = 'client' 
WHERE role = 'manager' 
  AND organization_id IS NULL 
  AND assigned_at > now() - interval '7 days';