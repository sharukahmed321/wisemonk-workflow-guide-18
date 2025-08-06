
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useEmploymentAgreement } from '@/hooks/useEmploymentAgreement';

interface EmploymentAgreementCardProps {
  onGenerated?: () => void;
}

export function EmploymentAgreementCard({ onGenerated }: EmploymentAgreementCardProps) {
  const { generateAgreement, isGenerating, error } = useEmploymentAgreement();

  const handleGenerate = async () => {
    const document = await generateAgreement();
    if (document && onGenerated) {
      onGenerated();
    }
  };

  const handleDownload = (downloadUrl: string, fileName: string) => {
    window.open(downloadUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Employment Agreement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending Generation
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Generate your employment agreement document to complete the preboarding process.
        </p>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Generation Failed</p>
              <p className="text-xs text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        <Button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Generating Agreement...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Generate Employment Agreement
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
