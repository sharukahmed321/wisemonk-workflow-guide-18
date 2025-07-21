
-- Add organization_id column to employees table
ALTER TABLE public.employees 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Update existing employees to inherit organization_id from their creator
UPDATE public.employees 
SET organization_id = (
  SELECT p.organization_id 
  FROM public.profiles p 
  WHERE p.user_id = auth.uid()
  LIMIT 1
);

-- Create index for better query performance
CREATE INDEX idx_employees_organization_id ON public.employees(organization_id);

-- Update RLS policies for employees to include organization-based access
DROP POLICY IF EXISTS "Managers and admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own record" ON public.employees;
DROP POLICY IF EXISTS "Admins and managers can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Admins and managers can update employees" ON public.employees;
DROP POLICY IF EXISTS "Only admins can delete employees" ON public.employees;

-- New RLS policies with organization context
CREATE POLICY "Users can view employees in their organization"
ON public.employees
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE POLICY "Users can view their own employee record"
ON public.employees
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Managers and admins can insert employees in their organization"
ON public.employees
FOR INSERT
WITH CHECK (
  (
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'superadmin'::app_role)
  )
  AND organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Managers and admins can update employees in their organization"
ON public.employees
FOR UPDATE
USING (
  (
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'superadmin'::app_role)
  )
  AND organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Only admins can delete employees in their organization"
ON public.employees
FOR DELETE
USING (
  (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'superadmin'::app_role)
  )
  AND organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);
