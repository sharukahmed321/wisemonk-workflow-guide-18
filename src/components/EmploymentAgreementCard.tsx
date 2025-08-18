
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
  const { generateAgreement, isGenerating, isLoading, error, document, isGenerated, downloadDocument } = useEmploymentAgreement(employeeId);

  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (isGenerated && onGenerated && !hasNotifiedRef.current) {
      onGenerated();
      hasNotifiedRef.current = true;
    }
  }, [isGenerated, onGenerated]);

  const handleDownload = () => {
    if (document) {
      downloadDocument(document);
    }
  };

  // Only show the card if there's a generated document or if we're loading
  if (!isLoading && !isGenerated) {
    return null;
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Button disabled className="w-full">
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            Checking for existing agreements...
          </Button>
        ) : isGenerated ? (
          <Button 
            onClick={handleDownload}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Employment Agreement
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
