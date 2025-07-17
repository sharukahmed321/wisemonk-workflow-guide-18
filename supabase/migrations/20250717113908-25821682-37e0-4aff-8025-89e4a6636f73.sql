-- Update the handle_new_user function to check for existing roles first
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
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

-- Create a function to get role hierarchy priority
CREATE OR REPLACE FUNCTION public.get_role_priority(role_name app_role)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT CASE role_name
    WHEN 'superadmin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'employee' THEN 3
    WHEN 'contractor' THEN 4
    WHEN 'client' THEN 5
    WHEN 'guest' THEN 6
    ELSE 999
  END;
$$;

-- Update the get_current_user_role function to use the new hierarchy
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY public.get_role_priority(role)
  LIMIT 1;
$$;