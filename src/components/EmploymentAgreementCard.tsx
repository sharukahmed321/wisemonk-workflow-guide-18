
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useEmploymentAgreement } from '@/hooks/useEmploymentAgreement';

interface EmploymentAgreementCardProps {
  onGenerated?: () => void;
  employeeId?: string;
}

export function EmploymentAgreementCard({ onGenerated, employeeId }: EmploymentAgreementCardProps) {
  const { generateAgreement, isGenerating, error, document, isGenerated, downloadDocument } = useEmploymentAgreement(employeeId);

  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (isGenerated && onGenerated && !hasNotifiedRef.current) {
      onGenerated();
      hasNotifiedRef.current = true;
    }
  }, [isGenerated, onGenerated]);

  const handleGenerate = async () => {
    const generatedDocument = await generateAgreement();
    if (generatedDocument && onGenerated && !hasNotifiedRef.current) {
      onGenerated();
      hasNotifiedRef.current = true;
    }
  };

  const handleDownload = () => {
    if (document) {
      downloadDocument(document);
    }
  };
  return (
    <Card>
     
      <CardContent className="space-y-4">

        {isGenerated ? (
          <Button 
            onClick={handleDownload}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Employment Agreement
          </Button>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
