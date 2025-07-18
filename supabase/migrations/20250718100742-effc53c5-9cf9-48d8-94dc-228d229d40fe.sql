
-- ✅ ENHANCED SECURITY IMPLEMENTATION - Production Ready

-- 1. Add missing columns for complete security tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verification_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_attempts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_reason TEXT,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. 🛡️ IMPROVED account lockout function with better logic
CREATE OR REPLACE FUNCTION public.should_lock_account(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- 3. 📧 CRITICAL: Add email verification enforcement function
CREATE OR REPLACE FUNCTION public.is_email_verified(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_time timestamp with time zone;
BEGIN
  SELECT email_confirmed_at 
  INTO verification_time
  FROM auth.users 
  WHERE id = user_id;
  
  RETURN verification_time IS NOT NULL;
END;
$$;

-- 4. Enhanced email verification tracking
CREATE OR REPLACE FUNCTION public.track_email_verification_attempt(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET email_verification_attempts = email_verification_attempts + 1,
      email_verification_sent_at = now()
  WHERE email = user_email;
END;
$$;

-- 5. 🚨 CRITICAL: Add rate limiting for verification emails
CREATE OR REPLACE FUNCTION public.can_send_verification_email(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_sent timestamp with time zone;
  attempt_count integer;
BEGIN
  SELECT email_verification_sent_at, email_verification_attempts
  INTO last_sent, attempt_count
  FROM public.profiles 
  WHERE email = user_email;
  
  -- Rate limiting - max 5 attempts per day
  IF attempt_count >= 5 AND last_sent > now() - interval '24 hours' THEN
    RETURN false;
  END IF;
  
  -- Cooldown period - 1 minute between sends
  IF last_sent IS NOT NULL AND last_sent > now() - interval '1 minute' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 6. 🛡️ IMPROVED: Better failed login tracking with IP logging
CREATE OR REPLACE FUNCTION public.increment_failed_login_attempts(
  user_email text, 
  ip_address text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- 7. Enhanced successful login tracking
CREATE OR REPLACE FUNCTION public.reset_failed_login_attempts(
  user_email text,
  ip_address text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- 8. 🚨 CRITICAL: Add function to enforce email verification
CREATE OR REPLACE FUNCTION public.require_email_verification(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- 9. Add triggers for automatic security enforcement
CREATE OR REPLACE FUNCTION public.enforce_account_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Auto-lock account on excessive failed attempts
  IF NEW.failed_login_attempts >= 5 AND OLD.failed_login_attempts < 5 THEN
    NEW.account_locked_until := now() + interval '1 hour';
    NEW.account_locked_reason := 'Automatic lockout - too many failed attempts';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS enforce_account_security_trigger ON public.profiles;
CREATE TRIGGER enforce_account_security_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_account_security();

-- 10. MONITORING: Add function to get security status
CREATE OR REPLACE FUNCTION public.get_account_security_status(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
