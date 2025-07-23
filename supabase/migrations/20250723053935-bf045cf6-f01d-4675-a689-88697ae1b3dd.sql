
-- Add Zoho Sign tracking columns to msa_documents table
ALTER TABLE public.msa_documents ADD COLUMN IF NOT EXISTS zoho_sign_request_id TEXT;
ALTER TABLE public.msa_documents ADD COLUMN IF NOT EXISTS zoho_sign_document_id TEXT;
ALTER TABLE public.msa_documents ADD COLUMN IF NOT EXISTS zoho_sign_status TEXT CHECK (zoho_sign_status IN ('sent', 'completed', 'declined', 'expired', 'failed', 'processing'));
ALTER TABLE public.msa_documents ADD COLUMN IF NOT EXISTS zoho_sign_error TEXT;
ALTER TABLE public.msa_documents ADD COLUMN IF NOT EXISTS signing_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.msa_documents ADD COLUMN IF NOT EXISTS signing_completed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_msa_documents_zoho_request_id ON public.msa_documents(zoho_sign_request_id);
CREATE INDEX IF NOT EXISTS idx_msa_documents_zoho_status ON public.msa_documents(zoho_sign_status);

-- Update trigger to handle MSA completion status
CREATE OR REPLACE FUNCTION public.update_msa_completion_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When Zoho Sign status becomes 'completed', update MSA completion
  IF NEW.zoho_sign_status = 'completed' AND (OLD.zoho_sign_status IS NULL OR OLD.zoho_sign_status != 'completed') THEN
    NEW.is_signed = true;
    NEW.signed_at = COALESCE(NEW.signing_completed_at, now());
    NEW.signed_by = COALESCE(NEW.signed_by, 'Electronic Signature');
    
    -- Update the user's profile MSA status
    UPDATE public.profiles 
    SET msa_signed = true,
        msa_signed_at = NEW.signed_at,
        msa_completed = true,
        msa_status = 'completed',
        msa_completed_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for MSA completion
DROP TRIGGER IF EXISTS trigger_msa_completion ON public.msa_documents;
CREATE TRIGGER trigger_msa_completion
  BEFORE UPDATE ON public.msa_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_msa_completion_status();
