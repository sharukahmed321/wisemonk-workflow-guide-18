
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Employment Agreement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-3">
          <p className="text-sm text-muted-foreground">
            You can optionally generate and review the employment agreement here, or it will be generated automatically when you proceed.
          </p>
        </div>
        {isLoading ? (
          <Button disabled className="w-full">
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            Checking for existing agreements...
          </Button>
        ) : isGenerated ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Employment agreement generated successfully
            </div>
            <Button 
              onClick={handleDownload}
              className="w-full"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Employment Agreement
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <Button 
              onClick={generateAgreement}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
