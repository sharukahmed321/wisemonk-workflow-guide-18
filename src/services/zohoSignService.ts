import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const MSASigningRequestSchema = z.object({
  msaDocumentId: z.string().uuid(),
});

export type MSASigningRequest = z.infer<typeof MSASigningRequestSchema>;

export interface MSASigningResponse {
  success: boolean;
  message: string;
  msa_document_id: string;
  user_name: string;
  organization_name?: string;
  zoho_sign: {
    request_id: string;
    document_id: string;
    status: string;
  };
  sent_at: string;
  error?: string;
}

export const sendMSAForSigning = async (request: MSASigningRequest): Promise<MSASigningResponse> => {
  try {
    // Validate input
    const validatedRequest = MSASigningRequestSchema.parse(request);
    
    console.log('Sending MSA for signing:', validatedRequest);

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('send-msa-for-signing', {
      body: validatedRequest,
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to send MSA for signing');
    }

    if (!data?.success) {
      console.error('MSA signing failed:', data?.error);
      throw new Error(data?.error || 'Failed to send MSA for signing');
    }

    console.log('MSA sent for signing successfully:', data);
    return data;
    
  } catch (error) {
    console.error('Error in sendMSAForSigning:', error);
    
    if (error instanceof z.ZodError) {
      throw new Error('Invalid request data provided');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('An unexpected error occurred while sending MSA for signing');
  }
};

export const checkMSASigningStatus = async (msaDocumentId: string) => {
  try {
    const { data, error } = await supabase
      .from('msa_documents')
      .select('zoho_sign_status, zoho_sign_request_id, zoho_sign_error, signing_sent_at, signing_completed_at')
      .eq('id', msaDocumentId)
      .single();

    if (error) {
      console.error('Error checking MSA signing status:', error);
      throw new Error('Failed to check signing status');
    }

    return data;
  } catch (error) {
    console.error('Error in checkMSASigningStatus:', error);
    throw error;
  }
};