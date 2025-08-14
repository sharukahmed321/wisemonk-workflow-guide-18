-- Add onboarding completion tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 1;

-- Update existing profiles to mark as complete if they have required fields
UPDATE public.profiles 
SET onboarding_completed = true,
    onboarding_completed_at = now()
WHERE first_name IS NOT NULL 
  AND last_name IS NOT NULL 
  AND job_title IS NOT NULL
  AND organization_id IS NOT NULL
  AND onboarding_completed = false;