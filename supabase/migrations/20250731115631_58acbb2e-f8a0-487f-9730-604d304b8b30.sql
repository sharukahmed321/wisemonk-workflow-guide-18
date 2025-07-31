-- Fix employees table RLS policies to avoid recursive lookups
-- Replace profiles table checks with user_roles table checks

-- Drop ALL existing employees RLS policies 
DROP POLICY IF EXISTS "Users can view employees in their organization" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
DROP POLICY IF EXISTS "Managers and admins can update employees in their organization" ON public.employees;
DROP POLICY IF EXISTS "Only admins can delete employees in their organization" ON public.employees;
DROP POLICY IF EXISTS "Clients can insert employees in their organization" ON public.employees;

-- Recreate policies using user_roles table instead of profiles table
CREATE POLICY "Users can view employees in their organization" 
ON public.employees 
FOR SELECT 
USING (
  (organization_id = (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    LIMIT 1
  )) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE POLICY "Users can view their own employee record" 
ON public.employees 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Managers and admins can update employees in their organization" 
ON public.employees 
FOR UPDATE 
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR 
   has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'superadmin'::app_role)) AND 
  (organization_id = (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    LIMIT 1
  ))
);

CREATE POLICY "Only admins can delete employees in their organization" 
ON public.employees 
FOR DELETE 
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'superadmin'::app_role)) AND 
  (organization_id = (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    LIMIT 1
  ))
);

CREATE POLICY "Clients can insert employees in their organization" 
ON public.employees 
FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'client'::app_role) OR 
   has_role(auth.uid(), 'manager'::app_role) OR 
   has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'superadmin'::app_role)) AND 
  (organization_id = (
    SELECT ur.organization_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    LIMIT 1
  ))
);