-- Add fields to employees table to track who added the employee
ALTER TABLE public.employees 
ADD COLUMN added_by_user_id uuid REFERENCES auth.users(id),
ADD COLUMN added_by_email text,
ADD COLUMN employment_agreement_url text,
ADD COLUMN employment_agreement_generated_at timestamp with time zone,
ADD COLUMN zoho_sign_request_id text,
ADD COLUMN zoho_sign_document_id text,
ADD COLUMN zoho_sign_status text,
ADD COLUMN zoho_sign_error text,
ADD COLUMN signing_sent_at timestamp with time zone;