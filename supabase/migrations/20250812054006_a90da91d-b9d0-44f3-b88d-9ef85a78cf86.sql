-- Add banking fields to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS ifsc_code text,
ADD COLUMN IF NOT EXISTS has_uan boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uan_number text;

-- Add document URL fields to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS bank_proof_document_url text,
ADD COLUMN IF NOT EXISTS graduation_certificate_url text,
ADD COLUMN IF NOT EXISTS relieving_letter_url text,
ADD COLUMN IF NOT EXISTS resume_url text,
ADD COLUMN IF NOT EXISTS passport_url text,
ADD COLUMN IF NOT EXISTS profile_picture_url text;