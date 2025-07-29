-- Create a comprehensive function to check if a user exists in the system
CREATE OR REPLACE FUNCTION public.check_user_exists(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;