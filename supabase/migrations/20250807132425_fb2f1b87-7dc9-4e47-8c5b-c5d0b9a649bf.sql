-- Now add the NOT NULL constraint for organization_id
ALTER TABLE public.employees 
ALTER COLUMN organization_id SET NOT NULL;

-- Create index for better performance on organization_id queries
CREATE INDEX IF NOT EXISTS idx_employees_organization_id ON public.employees(organization_id);