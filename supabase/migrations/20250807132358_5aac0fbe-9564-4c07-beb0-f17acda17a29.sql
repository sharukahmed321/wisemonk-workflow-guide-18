-- First, fix existing employees without organization_id
-- Check current data and fix organization_id for existing employees
UPDATE public.employees 
SET organization_id = (
  SELECT p.organization_id 
  FROM public.profiles p 
  WHERE p.user_id = employees.added_by_user_id
  LIMIT 1
)
WHERE organization_id IS NULL 
  AND added_by_user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = employees.added_by_user_id 
    AND p.organization_id IS NOT NULL
  );

-- For any remaining employees without organization_id, set to the first available organization
-- This is a fallback for data integrity
UPDATE public.employees 
SET organization_id = (
  SELECT id FROM public.organizations LIMIT 1
)
WHERE organization_id IS NULL;