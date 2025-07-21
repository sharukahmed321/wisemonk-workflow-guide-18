
-- Create trigger to update profile onboarding status when organization is updated
CREATE OR REPLACE FUNCTION public.update_profile_onboarding_on_org_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  profile_record RECORD;
BEGIN
  -- Find all profiles linked to this organization and update their onboarding status
  FOR profile_record IN 
    SELECT user_id FROM public.profiles WHERE organization_id = NEW.id
  LOOP
    -- Update the profile to trigger the onboarding status update
    UPDATE public.profiles 
    SET updated_at = now()
    WHERE user_id = profile_record.user_id;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on organizations table
DROP TRIGGER IF EXISTS update_profile_onboarding_on_org_update ON public.organizations;
CREATE TRIGGER update_profile_onboarding_on_org_update
  AFTER UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_onboarding_on_org_change();
