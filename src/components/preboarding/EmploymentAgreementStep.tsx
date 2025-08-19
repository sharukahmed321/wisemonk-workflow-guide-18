
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmploymentAgreementCard } from '../EmploymentAgreementCard';
import { FileText } from 'lucide-react';
interface EmploymentAgreementData {
  completedAt?: Date;
  documentGenerated?: boolean;
}
interface EmploymentAgreementStepProps {
  data: EmploymentAgreementData;
  onComplete: (data: EmploymentAgreementData) => void;
  onPrevious: () => void;
  employeeId?: string;
}
export function EmploymentAgreementStep({
  data,
  onComplete,
  onPrevious,
  employeeId
}: EmploymentAgreementStepProps) {
  const [documentGenerated, setDocumentGenerated] = useState(data.documentGenerated || false);
  const handleDocumentGenerated = () => {
    setDocumentGenerated(true);
  };
  const handleComplete = () => {
    // Remove dependency on documentGenerated - allow proceeding without generating agreement
    onComplete({
      completedAt: new Date(),
      documentGenerated
    });
  };

  // Allow completion only when document is generated
  const isComplete = documentGenerated;
  return <div className="space-y-6">
      <div className="text-left">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">Employment Agreement</h3>
        <p className="text-muted-foreground">This agreement confirms your role, terms of employment, and benefits.
Please review and sign to complete your preboarding.</p>
      </div>

      {/* Document Generation */}
      <EmploymentAgreementCard onGenerated={handleDocumentGenerated} employeeId={employeeId} />

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <div className="flex flex-col items-end gap-2">
          {!documentGenerated && (
            <p className="text-sm text-muted-foreground">
              Please generate the employment agreement first
            </p>
          )}
          <Button onClick={handleComplete} disabled={!isComplete} className="px-8">
            Send for E-Signing
          </Button>
        </div>
      </div>
    </div>;
}
