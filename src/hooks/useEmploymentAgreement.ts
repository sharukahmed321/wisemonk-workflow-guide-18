
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmploymentAgreementDocument {
  id: string;
  file_name: string;
  file_path: string;
  download_url?: string;
  created_at: string;
  is_signed: boolean;
  generation_method: string;
}

interface UseEmploymentAgreementReturn {
  generateAgreement: () => Promise<EmploymentAgreementDocument | null>;
  isGenerating: boolean;
  error: string | null;
  document: EmploymentAgreementDocument | null;
  isGenerated: boolean;
  downloadDocument: (document: EmploymentAgreementDocument) => void;
}

export function useEmploymentAgreement(employeeId?: string): UseEmploymentAgreementReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<EmploymentAgreementDocument | null>(null);
  const { toast } = useToast();

  const generateAgreement = async (): Promise<EmploymentAgreementDocument | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No authenticated session found');
      }

      console.log('🔄 Calling generate-employment-agreement function...');

      const { data, error } = await supabase.functions.invoke('generate-employment-agreement', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: employeeId ? { employeeId } : undefined,
      });

      if (error) {
        console.error('❌ Employment agreement generation error:', error);
        throw new Error(error.message || 'Failed to generate employment agreement');
      }

      if (!data?.success) {
        throw new Error(data?.details || 'Employment agreement generation failed');
      }

      console.log('✅ Employment agreement generated successfully:', data.document);

      setDocument(data.document);

      toast({
        title: "Employment Agreement Generated",
        description: "Your employment agreement has been generated successfully.",
      });

      return data.document;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('💥 Employment agreement generation failed:', errorMessage);
      
      setError(errorMessage);
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDocument = (document: EmploymentAgreementDocument) => {
    if (document.download_url) {
      window.open(document.download_url, '_blank');
    } else {
      toast({
        title: "Download Error",
        description: "Download URL not available for this document.",
        variant: "destructive",
      });
    }
  };

  const isGenerated = !!document;

  return {
    generateAgreement,
    isGenerating,
    error,
    document,
    isGenerated,
    downloadDocument,
  };
}
