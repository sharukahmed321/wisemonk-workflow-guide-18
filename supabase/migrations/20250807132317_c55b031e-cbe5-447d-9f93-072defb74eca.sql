-- Fix organization_id for existing employees and add data integrity
-- Update existing employees without organization_id by linking them to their creator's organization
UPDATE public.employees 
SET organization_id = (
  SELECT p.organization_id 
  FROM public.profiles p 
  WHERE p.user_id = employees.added_by_user_id
  LIMIT 1
)
WHERE organization_id IS NULL 
  AND added_by_user_id IS NOT NULL;

-- Add constraint to ensure organization_id is always set for new employees
ALTER TABLE public.employees 
ALTER COLUMN organization_id SET NOT NULL;

-- Create index for better performance on organization_id queries
CREATE INDEX IF NOT EXISTS idx_employees_organization_id ON public.employees(organization_id);