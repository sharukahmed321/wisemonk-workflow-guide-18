
-- Check if we need to create the employment_agreements table to match the storage bucket
-- This table will store metadata about generated employment agreements
CREATE TABLE IF NOT EXISTS public.employment_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'employment_agreement',
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT DEFAULT 'application/pdf',
  generation_method TEXT,
  document_version INTEGER DEFAULT 1,
  is_signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  zoho_sign_request_id TEXT,
  zoho_sign_document_id TEXT,
  zoho_sign_status TEXT,
  zoho_sign_error TEXT,
  signing_sent_at TIMESTAMP WITH TIME ZONE,
  signing_completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.employment_agreements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employment_agreements table
CREATE POLICY "Users can view their organization's employment agreements" 
  ON public.employment_agreements 
  FOR SELECT 
  USING (organization_id IN (
    SELECT profiles.organization_id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can create employment agreements for their organization" 
  ON public.employment_agreements 
  FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() AND 
    organization_id IN (
      SELECT profiles.organization_id 
      FROM profiles 
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's employment agreements" 
  ON public.employment_agreements 
  FOR UPDATE 
  USING (organization_id IN (
    SELECT profiles.organization_id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  ));

-- Add trigger for updated_at timestamp
CREATE TRIGGER employment_agreements_updated_at 
  BEFORE UPDATE ON public.employment_agreements 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
