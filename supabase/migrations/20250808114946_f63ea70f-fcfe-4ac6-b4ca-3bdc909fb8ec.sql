-- Add document storage columns to employees table
ALTER TABLE public.employees 
ADD COLUMN pan_card_url TEXT,
ADD COLUMN previous_payslips_url TEXT, 
ADD COLUMN previous_offer_letter_url TEXT,
ADD COLUMN documents_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN documents_verification_status TEXT DEFAULT 'pending';

-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-documents', 'employee-documents', false);

-- Create RLS policies for employee documents bucket
CREATE POLICY "Users can view their organization's employee documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'employee-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT e.id::text 
    FROM public.employees e
    JOIN public.user_roles ur ON ur.organization_id = e.organization_id
    WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload employee documents for their organization" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'employee-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT e.id::text 
    FROM public.employees e
    JOIN public.user_roles ur ON ur.organization_id = e.organization_id
    WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update employee documents for their organization" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'employee-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT e.id::text 
    FROM public.employees e
    JOIN public.user_roles ur ON ur.organization_id = e.organization_id
    WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete employee documents for their organization" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'employee-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT e.id::text 
    FROM public.employees e
    JOIN public.user_roles ur ON ur.organization_id = e.organization_id
    WHERE ur.user_id = auth.uid()
  )
);