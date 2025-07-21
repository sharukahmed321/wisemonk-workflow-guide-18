
-- Create storage bucket for MSA agreements
INSERT INTO storage.buckets (id, name, public)
VALUES ('msa-agreements', 'msa-agreements', true);

-- Create storage policies for the msa-agreements bucket
CREATE POLICY "Users can view their organization's MSA documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'msa-agreements' AND
  auth.uid() IN (
    SELECT p.user_id 
    FROM public.profiles p
    WHERE p.organization_id = (
      SELECT split_part(name, '/', 1)::uuid 
      FROM storage.objects 
      WHERE id = storage.objects.id
    )
  )
);

CREATE POLICY "Authenticated users can upload MSA documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'msa-agreements' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their organization's MSA documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'msa-agreements' AND
  auth.uid() IN (
    SELECT p.user_id 
    FROM public.profiles p
    WHERE p.organization_id = (
      SELECT split_part(name, '/', 1)::uuid 
      FROM storage.objects 
      WHERE id = storage.objects.id
    )
  )
);

-- Create MSA documents table
CREATE TABLE public.msa_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  organization_id uuid REFERENCES public.organizations NOT NULL,
  document_type text NOT NULL DEFAULT 'msa_agreement',
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text DEFAULT 'application/pdf',
  generation_method text, -- 'google_docs' or 'hardcoded_template'
  document_version integer DEFAULT 1,
  is_signed boolean DEFAULT false,
  signed_at timestamp with time zone,
  signed_by text,
  metadata jsonb, -- Store MSA data used for generation
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on msa_documents table
ALTER TABLE public.msa_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for msa_documents
CREATE POLICY "Users can view their organization's MSA documents"
ON public.msa_documents FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create MSA documents for their organization"
ON public.msa_documents FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their organization's MSA documents"
ON public.msa_documents FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_msa_documents_updated_at
  BEFORE UPDATE ON public.msa_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
