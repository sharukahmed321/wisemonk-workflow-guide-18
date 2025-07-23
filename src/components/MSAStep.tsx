import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MSAStepProps {
  onboardingData?: any;
  onStepComplete?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  onComplete?: () => void;
}

export function MSAStep({ 
  onboardingData, 
  onStepComplete, 
  onNext, 
  onPrev, 
  canGoNext, 
  canGoPrev,
  onComplete 
}: MSAStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const { user } = useAuth();

  const generateMSA = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-msa-agreement', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      if (data?.document_url) {
        setDocumentUrl(data.document_url);
        toast.success('MSA agreement generated successfully');
      }
    } catch (error) {
      console.error('Error generating MSA:', error);
      toast.error('Failed to generate MSA agreement');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinue = () => {
    if (onStepComplete) {
      onStepComplete();
    }
    
    if (onComplete) {
      onComplete();
    } else if (canGoNext && onNext) {
      onNext();
    }
  };

  const isSigned = onboardingData?.msa_info?.data?.msa_signed;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Master Service Agreement</h1>
        <p className="text-muted-foreground">Review and sign the service agreement</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            MSA Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSigned ? (
            <div className="flex items-center gap-2 p-4 bg-success/10 text-success rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>MSA Agreement has been signed</span>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                Generate your Master Service Agreement document to proceed with the setup.
              </p>
              
              {!documentUrl ? (
                <Button 
                  onClick={generateMSA} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? 'Generating...' : 'Generate MSA Document'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-primary/10 text-primary rounded-lg">
                    <FileText className="h-5 w-5" />
                    <span>Document generated successfully</span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(documentUrl, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download MSA Document
                  </Button>
                  
                  <p className="text-sm text-muted-foreground">
                    Please download, review, and sign the document. Once signed, you can continue with the setup.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between pt-4">
            {onPrev && (
              <Button
                type="button"
                variant="outline"
                onClick={onPrev}
                disabled={!canGoPrev}
              >
                Previous
              </Button>
            )}
            <Button 
              onClick={handleContinue}
              disabled={!isSigned && !documentUrl}
              className={!onPrev ? 'w-full' : ''}
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}