
-- Create function to increment failed login attempts
CREATE OR REPLACE FUNCTION public.increment_failed_login_attempts(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET failed_login_attempts = failed_login_attempts + 1
  WHERE email = user_email;
END;
$$;
