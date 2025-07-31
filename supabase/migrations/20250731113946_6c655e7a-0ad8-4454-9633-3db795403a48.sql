-- Fix infinite recursion in profiles RLS policies
-- The issue is likely in policies that reference the profiles table within profiles table policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins and managers can view employee profiles" ON public.profiles;
DROP POLICY IF EXISTS "Clients can create pre-registered employee profiles" ON public.profiles;
DROP POLICY IF EXISTS "Organization members can view pre-registered profiles" ON public.profiles;

-- Recreate policies without recursive references
CREATE POLICY "Admins and managers can view employee profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Clients can create pre-registered employee profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'client'::app_role) OR 
   has_role(auth.uid(), 'manager'::app_role) OR 
   has_role(auth.uid(), 'admin'::app_role)) AND 
  (is_pre_registered = true) AND 
  (organization_id = (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    LIMIT 1
  ))
);

CREATE POLICY "Organization members can view pre-registered profiles" 
ON public.profiles 
FOR SELECT 
USING (
  (is_pre_registered = true) AND 
  (user_id IS NULL) AND 
  (organization_id = (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    LIMIT 1
  ))
);