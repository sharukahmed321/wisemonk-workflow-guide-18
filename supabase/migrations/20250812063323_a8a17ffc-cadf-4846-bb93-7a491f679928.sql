-- Fix all database function security by setting search_path
-- This addresses all 25 function security warnings

-- Function 1: update_profile_onboarding_on_org_change
CREATE OR REPLACE FUNCTION public.update_profile_onboarding_on_org_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  profile_record RECORD;
BEGIN
  -- Find all profiles linked to this organization and update their onboarding status
  FOR profile_record IN 
    SELECT user_id FROM public.profiles WHERE organization_id = NEW.id
  LOOP
    -- Update the profile to trigger the onboarding status update
    UPDATE public.profiles 
    SET updated_at = now()
    WHERE user_id = profile_record.user_id;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Function 2: calculate_age
CREATE OR REPLACE FUNCTION public.calculate_age(birth_date date)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path = public, pg_temp
AS $function$
  SELECT CASE 
    WHEN birth_date IS NULL THEN NULL
    ELSE EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::INTEGER
  END;
$function$;

-- Function 3: update_employee_age
CREATE OR REPLACE FUNCTION public.update_employee_age()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.age := public.calculate_age(NEW.date_of_birth);
  RETURN NEW;
END;
$function$;

-- Function 4: cleanup_expired_otp_codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  DELETE FROM public.otp_codes 
  WHERE expires_at < now() OR used = true;
END;
$function$;

-- Function 5: update_msa_completion_status
CREATE OR REPLACE FUNCTION public.update_msa_completion_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
BEGIN
  -- When Zoho Sign status becomes 'completed', update MSA completion
  IF NEW.zoho_sign_status = 'completed' AND (OLD.zoho_sign_status IS NULL OR OLD.zoho_sign_status != 'completed') THEN
    NEW.is_signed = true;
    NEW.signed_at = COALESCE(NEW.signing_completed_at, now());
    NEW.signed_by = COALESCE(NEW.signed_by, 'Electronic Signature');
    
    -- Update the user's profile MSA status
    UPDATE public.profiles 
    SET msa_signed = true,
        msa_signed_at = NEW.signed_at,
        msa_completed = true,
        msa_status = 'completed',
        msa_completed_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function 6: should_lock_account
CREATE OR REPLACE FUNCTION public.should_lock_account(user_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  attempts_count integer;
  last_attempt timestamp with time zone;
  current_locked_until timestamp with time zone;
BEGIN
  SELECT failed_login_attempts, last_failed_login_at, account_locked_until
  INTO attempts_count, last_attempt, current_locked_until
  FROM public.profiles 
  WHERE email = user_email;
  
  -- Check if already locked
  IF current_locked_until IS NOT NULL AND current_locked_until > now() THEN
    RETURN true;
  END IF;
  
  -- Reset attempts if last failure was more than 1 hour ago
  IF last_attempt IS NOT NULL AND last_attempt < now() - interval '1 hour' THEN
    UPDATE public.profiles 
    SET failed_login_attempts = 0
    WHERE email = user_email;
    attempts_count := 0;
  END IF;
  
  -- Lock account if 5 or more failed attempts
  IF attempts_count >= 5 THEN
    DECLARE
      lockout_duration interval;
    BEGIN
      -- Progressive lockout: 1 hour, then 24 hours for repeat offenses
      IF attempts_count = 5 THEN
        lockout_duration := interval '1 hour';
      ELSE
        lockout_duration := interval '24 hours';
      END IF;
      
      UPDATE public.profiles 
      SET account_locked_until = now() + lockout_duration,
          account_locked_reason = 'Too many failed login attempts'
      WHERE email = user_email;
    END;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- Function 7: is_email_verified
CREATE OR REPLACE FUNCTION public.is_email_verified(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  verification_time timestamp with time zone;
BEGIN
  SELECT email_confirmed_at 
  INTO verification_time
  FROM auth.users 
  WHERE id = user_id;
  
  RETURN verification_time IS NOT NULL;
END;
$function$;

-- Function 8: calculate_salary_breakdown
CREATE OR REPLACE FUNCTION public.calculate_salary_breakdown()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
BEGIN
  -- Only calculate if annual_gross_salary is provided
  IF NEW.annual_gross_salary IS NOT NULL THEN
    -- Base calculation: 50% of gross goes to basic salary
    NEW.annual_basic := NEW.annual_gross_salary / 2;
    
    -- HRA is 50% of basic salary (25% of gross)
    NEW.annual_hra := NEW.annual_basic / 2;
    
    -- LTA is 20% of basic salary (10% of gross)
    NEW.annual_lta := NEW.annual_basic / 5;
    
    -- YFBP (Yearly Flexible Benefits) - threshold-based
    NEW.yfbp := CASE 
      WHEN NEW.annual_gross_salary <= 1440000 THEN 0 
      ELSE 169392 
    END;
    
    -- Special Allowance is the remainder after deducting all components
    NEW.annual_special_allowance := NEW.annual_gross_salary - NEW.annual_basic - NEW.annual_hra - NEW.annual_lta - NEW.yfbp - 21600;
    
    -- Monthly equivalents (divide by 12)
    NEW.monthly_gross := NEW.annual_gross_salary / 12;
    NEW.monthly_basic := NEW.annual_basic / 12;
    NEW.monthly_hra := NEW.annual_hra / 12;
    NEW.monthly_lta := NEW.annual_lta / 12;
    NEW.monthly_special_allowance := NEW.annual_special_allowance / 12;
    NEW.mfbp := NEW.yfbp / 12;
    
    -- Also update the legacy salary field for backward compatibility
    NEW.salary := NEW.annual_gross_salary;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function 9: increment_failed_login_attempts (with ip_address)
CREATE OR REPLACE FUNCTION public.increment_failed_login_attempts(user_email text, ip_address text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.profiles 
  SET failed_login_attempts = failed_login_attempts + 1,
      last_failed_login_at = now()
  WHERE email = user_email;
  
  -- Log the failed attempt for monitoring
  INSERT INTO public.auth_audit_logs (
    user_id, 
    event_type, 
    ip_address,
    details,
    success,
    created_at
  ) VALUES (
    (SELECT user_id FROM public.profiles WHERE email = user_email),
    'failed_login',
    ip_address::inet,
    json_build_object('email', user_email, 'timestamp', now()),
    false,
    now()
  );
END;
$function$;

-- Function 10: reset_failed_login_attempts
CREATE OR REPLACE FUNCTION public.reset_failed_login_attempts(user_email text, ip_address text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.profiles 
  SET failed_login_attempts = 0,
      last_failed_login_at = NULL,
      account_locked_until = NULL,
      account_locked_reason = NULL,
      last_login_at = now()
  WHERE email = user_email;
  
  -- Log successful login
  INSERT INTO public.auth_audit_logs (
    user_id, 
    event_type, 
    ip_address,
    details,
    success,
    created_at
  ) VALUES (
    (SELECT user_id FROM public.profiles WHERE email = user_email),
    'successful_login',
    ip_address::inet,
    json_build_object('email', user_email, 'timestamp', now()),
    true,
    now()
  );
END;
$function$;

-- Function 11: require_email_verification
CREATE OR REPLACE FUNCTION public.require_email_verification(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  is_verified boolean;
  user_email text;
BEGIN
  SELECT email, email_confirmed_at IS NOT NULL
  INTO user_email, is_verified
  FROM auth.users 
  WHERE id = user_id;
  
  -- If not verified, log the blocked action
  IF NOT is_verified THEN
    INSERT INTO public.auth_audit_logs (
      user_id, 
      event_type, 
      details,
      success,
      created_at
    ) VALUES (
      user_id,
      'blocked_unverified_access',
      json_build_object('email', user_email, 'timestamp', now()),
      false,
      now()
    );
    
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

-- Function 12: enforce_account_security
CREATE OR REPLACE FUNCTION public.enforce_account_security()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  -- Auto-lock account on excessive failed attempts
  IF NEW.failed_login_attempts >= 5 AND OLD.failed_login_attempts < 5 THEN
    NEW.account_locked_until := now() + interval '1 hour';
    NEW.account_locked_reason := 'Automatic lockout - too many failed attempts';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function 13: get_account_security_status
CREATE OR REPLACE FUNCTION public.get_account_security_status(user_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'email', p.email,
    'is_locked', p.account_locked_until > now(),
    'locked_until', p.account_locked_until,
    'lock_reason', p.account_locked_reason,
    'failed_attempts', p.failed_login_attempts,
    'last_failed_login', p.last_failed_login_at,
    'last_successful_login', p.last_login_at,
    'email_verified', u.email_confirmed_at IS NOT NULL,
    'email_verified_at', u.email_confirmed_at,
    'verification_attempts', p.email_verification_attempts,
    'last_verification_sent', p.email_verification_sent_at
  ) INTO result
  FROM public.profiles p
  JOIN auth.users u ON p.user_id = u.id
  WHERE p.email = user_email;
  
  RETURN result;
END;
$function$;

-- Function 14: get_onboarding_progress
CREATE OR REPLACE FUNCTION public.get_onboarding_progress(user_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
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

-- Function 15: upsert_organization
CREATE OR REPLACE FUNCTION public.upsert_organization(p_organization_id uuid DEFAULT NULL::uuid, p_name text DEFAULT NULL::text, p_legal_name text DEFAULT NULL::text, p_country text DEFAULT NULL::text, p_employee_count employee_count_range DEFAULT NULL::employee_count_range, p_business_address text DEFAULT NULL::text, p_business_city text DEFAULT NULL::text, p_business_state text DEFAULT NULL::text, p_business_postal_code text DEFAULT NULL::text, p_website text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_industry text DEFAULT NULL::text, p_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
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

-- Function 16: log_msa_completion
CREATE OR REPLACE FUNCTION public.log_msa_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
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

-- Function 17: check_user_exists
CREATE OR REPLACE FUNCTION public.check_user_exists(user_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  auth_user_exists boolean := false;
  profile_exists boolean := false;
  email_verified boolean := false;
  user_id_found uuid;
  result jsonb;
BEGIN
  -- Clean and normalize the email
  user_email := lower(trim(user_email));
  
  -- Check if user exists in auth.users table
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = user_email
  ) INTO auth_user_exists;
  
  -- If user exists in auth, get their verification status and ID
  IF auth_user_exists THEN
    SELECT id, email_confirmed_at IS NOT NULL
    INTO user_id_found, email_verified
    FROM auth.users 
    WHERE email = user_email;
  END IF;
  
  -- Check if user exists in profiles table
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = user_email
  ) INTO profile_exists;
  
  -- Build the result object
  result := jsonb_build_object(
    'exists', auth_user_exists,
    'email_verified', email_verified,
    'profile_exists', profile_exists,
    'user_id', user_id_found,
    'status', CASE 
      WHEN NOT auth_user_exists THEN 'new_user'
      WHEN auth_user_exists AND NOT email_verified THEN 'unverified'
      WHEN auth_user_exists AND email_verified AND NOT profile_exists THEN 'partial_registration'
      WHEN auth_user_exists AND email_verified AND profile_exists THEN 'complete'
      ELSE 'unknown'
    END
  );
  
  RETURN result;
END;
$function$;

-- Function 18: assign_organization_role
CREATE OR REPLACE FUNCTION public.assign_organization_role(p_user_id uuid, p_organization_id uuid, p_role app_role DEFAULT 'employee'::app_role)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  -- Update existing role record with organization_id
  UPDATE public.user_roles 
  SET organization_id = p_organization_id,
      role = p_role,
      assigned_at = now()
  WHERE user_id = p_user_id;
  
  -- If no role exists, insert a new one with organization_id
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role, organization_id, assigned_at)
    VALUES (p_user_id, p_role, p_organization_id, now());
  END IF;
END;
$function$;

-- Function 19: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  existing_profile_id uuid;
  existing_org_id uuid;
  employee_update_count integer;
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
    
    -- CRITICAL FIX: Also update the employees table to link the user_id AND change status to "Preboarding"
    UPDATE public.employees 
    SET 
      user_id = NEW.id,
      status = 'Preboarding',
      updated_at = now()
    WHERE email = NEW.email 
      AND user_id IS NULL 
      AND organization_id = existing_org_id;
    
    GET DIAGNOSTICS employee_update_count = ROW_COUNT;
    
    -- Update ALL matching user_roles records with the new user_id
    UPDATE public.user_roles 
    SET user_id = NEW.id,
        assigned_at = now()
    WHERE user_id IS NULL 
      AND organization_id = existing_org_id
      AND role = 'employee';
    
    -- Log the conversion event with employee linking info
    INSERT INTO public.auth_audit_logs (user_id, event_type, success, details)
    VALUES (
      NEW.id,
      'pre_registered_user_signup',
      true,
      jsonb_build_object(
        'email', NEW.email, 
        'organization_id', existing_org_id,
        'converted_from_pre_registration', true,
        'employee_records_linked', employee_update_count,
        'status_changed_to', 'Preboarding'
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
$function$;

-- Function 20: update_onboarding_status
CREATE OR REPLACE FUNCTION public.update_onboarding_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$BEGIN
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

  -- NEW: Update user_roles organization_id immediately when profile organization_id changes
  IF NEW.organization_id IS NOT NULL AND (OLD.organization_id IS NULL OR NEW.organization_id != OLD.organization_id) THEN
    -- Update existing user roles to include organization_id
    UPDATE public.user_roles 
    SET organization_id = NEW.organization_id,
        assigned_at = now()
    WHERE user_id = NEW.user_id;
    
    -- If user is the organization creator, upgrade their role to manager
    IF EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = NEW.organization_id 
        AND created_by = NEW.user_id
    ) THEN
      -- Update role from client to manager for organization creator
     -- UPDATE public.user_roles 
      --SET role = 'client'::app_role,
        --  assigned_at = now()
     -- WHERE user_id = NEW.user_id 
     --   AND role = 'client'::app_role;
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
    ELSE
      NEW.setup_completed = false;
      NEW.setup_completed_at = NULL;
    END IF;
  END;

  RETURN NEW;
END;$function$;

-- Function 21: get_current_user_role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY public.get_role_priority(role)
  LIMIT 1;
$function$;

-- Function 22: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Function 23: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Function 24: get_role_priority
CREATE OR REPLACE FUNCTION public.get_role_priority(role_name app_role)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path = public, pg_temp
AS $function$
  SELECT CASE role_name
    WHEN 'superadmin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'employee' THEN 3
    WHEN 'contractor' THEN 4
    WHEN 'client' THEN 5
    WHEN 'guest' THEN 6
    ELSE 999
  END;
$function$;

-- Function 25: increment_failed_login_attempts (single parameter)
CREATE OR REPLACE FUNCTION public.increment_failed_login_attempts(user_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.profiles 
  SET failed_login_attempts = failed_login_attempts + 1
  WHERE email = user_email;
END;
$function$;