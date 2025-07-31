-- Update employees table INSERT policy to allow clients
DROP POLICY IF EXISTS "Managers and admins can insert employees in their organization" ON public.employees;

CREATE POLICY "Clients can insert employees in their organization" 
ON public.employees 
FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'client'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)) 
  AND (organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  ))
);

-- Add INSERT policy for profiles table to allow pre-registered employee creation
CREATE POLICY "Clients can create pre-registered employee profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Allow creating pre-registered profiles for employees in same organization
  (has_role(auth.uid(), 'client'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) 
  AND is_pre_registered = true 
  AND organization_id IN (
    SELECT p.organization_id
    FROM profiles p
    WHERE p.user_id = auth.uid()
  )
);

-- Add INSERT policy for standard user profile creation during signup
CREATE POLICY "Users can create their own profile during signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND is_pre_registered = false
);

-- Update user_roles INSERT policy to allow clients to assign employee roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can assign employee roles in their organization" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'client'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) 
  AND role = 'employee'::app_role 
  AND organization_id IN (
    SELECT p.organization_id
    FROM profiles p
    WHERE p.user_id = auth.uid()
  )
);