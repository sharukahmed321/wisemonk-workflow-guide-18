-- Create employment-agreements storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employment-agreements', 'employment-agreements', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for employment-agreements bucket
CREATE POLICY "Employment agreements are viewable by organization members" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'employment-agreements' AND 
  auth.uid() IN (
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.organization_id = (storage.foldername(name))[1]::uuid
  )
);

CREATE POLICY "Users can upload employment agreements for their organization" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'employment-agreements' AND 
  auth.uid() IN (
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.organization_id = (storage.foldername(name))[1]::uuid
  )
);

CREATE POLICY "Users can update employment agreements for their organization" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'employment-agreements' AND 
  auth.uid() IN (
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.organization_id = (storage.foldername(name))[1]::uuid
  )
);

CREATE POLICY "Users can delete employment agreements for their organization" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'employment-agreements' AND 
  auth.uid() IN (
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.organization_id = (storage.foldername(name))[1]::uuid
  )
);