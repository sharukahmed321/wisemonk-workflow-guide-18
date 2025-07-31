-- Fix employees_status_check constraint to include 'Invited' as valid status
-- First drop the existing constraint
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_status_check;

-- Add the updated constraint that includes 'Invited'
ALTER TABLE public.employees ADD CONSTRAINT employees_status_check 
CHECK (status IN ('Active', 'Onboarding', 'Preboarding', 'Invited', 'Inactive'));

-- Clean up any orphaned pre-registered profiles (profiles without user_id that have been sitting around)
DELETE FROM public.profiles 
WHERE is_pre_registered = true 
  AND user_id IS NULL 
  AND created_at < now() - interval '24 hours';

-- Clean up any orphaned user_roles records (roles without user_id)
DELETE FROM public.user_roles 
WHERE user_id IS NULL 
  AND assigned_at < now() - interval '24 hours';