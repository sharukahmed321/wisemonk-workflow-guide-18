-- Remove custom OTP implementation in favor of native Supabase email verification

-- Drop the custom otp_codes table
DROP TABLE IF EXISTS public.otp_codes;

-- Remove custom OTP-related functions
DROP FUNCTION IF EXISTS public.can_send_verification_email(text);
DROP FUNCTION IF EXISTS public.track_email_verification_attempt(text);
DROP FUNCTION IF EXISTS public.cleanup_expired_otp_codes();

-- Update profiles table to remove custom email verification fields
-- Keep email_verified for compatibility but it will use Supabase's native verification
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS email_verification_attempts,
DROP COLUMN IF EXISTS email_verification_sent_at;