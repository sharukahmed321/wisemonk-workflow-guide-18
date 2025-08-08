
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { EmploymentAgreementCard } from '../EmploymentAgreementCard';
import { FileText, Download, Shield, CheckCircle } from 'lucide-react';

interface EmploymentAgreementData {
  agreedToTerms: boolean;
  digitalSignature?: string;
  signatureDate?: Date;
  completedAt?: Date;
  documentGenerated?: boolean;
}

interface EmploymentAgreementStepProps {
  data: EmploymentAgreementData;
  onComplete: (data: EmploymentAgreementData) => void;
  onPrevious: () => void;
  employeeId?: string;
}

export function EmploymentAgreementStep({ data, onComplete, onPrevious, employeeId }: EmploymentAgreementStepProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(data.agreedToTerms);
  const [digitalSignature, setDigitalSignature] = useState(data.digitalSignature);
  const [documentGenerated, setDocumentGenerated] = useState(data.documentGenerated || false);
  const [showSignature, setShowSignature] = useState(false);

  const handleSignatureComplete = (signature: string) => {
    setDigitalSignature(signature);
    setShowSignature(false);
  };

  const handleDocumentGenerated = () => {
    setDocumentGenerated(true);
  };

  const handleComplete = () => {
    if (documentGenerated) {
      onComplete({
        agreedToTerms,
        digitalSignature,
        signatureDate: digitalSignature ? new Date() : undefined,
        completedAt: new Date(),
        documentGenerated,
      });
    }
  };
  const isComplete = documentGenerated;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">Employment Agreement</h3>
        <p className="text-muted-foreground">
          Generate, review, and sign your employment agreement to complete preboarding
        </p>
      </div>

      {/* Document Generation */}
      <EmploymentAgreementCard onGenerated={handleDocumentGenerated} employeeId={employeeId} />

      {/* Agreement Content - Only show after document is generated */}
      {documentGenerated && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Employment Agreement Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 w-full rounded-md border p-4">
                <div className="space-y-4 text-sm">
                  <h4 className="font-semibold text-foreground">Terms and Conditions</h4>
                  
                  <div className="space-y-3">
                    <p className="text-muted-foreground">
                      <strong>1. Employment Terms:</strong> This agreement confirms your employment with our company 
                      effective from your start date. You will be employed in the capacity as specified in your 
                      offer letter.
                    </p>
                    
                    <p className="text-muted-foreground">
                      <strong>2. Confidentiality:</strong> You agree to maintain strict confidentiality regarding 
                      all company information, trade secrets, and proprietary information both during and after 
                      your employment.
                    </p>
                    
                    <p className="text-muted-foreground">
                      <strong>3. Code of Conduct:</strong> You agree to adhere to the company's code of conduct, 
                      policies, and procedures as outlined in the employee handbook.
                    </p>
                    
                    <p className="text-muted-foreground">
                      <strong>4. Background Verification:</strong> Your employment is subject to successful 
                      completion of background verification processes and document validation.
                    </p>
                    
                    <p className="text-muted-foreground">
                      <strong>5. Data Protection:</strong> You consent to the collection and processing of your 
                      personal data for employment purposes in accordance with applicable data protection laws.
                    </p>
                    
                    <p className="text-muted-foreground">
                      <strong>6. Termination:</strong> Either party may terminate this agreement with appropriate 
                      notice as specified in your employment contract.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Agreement Acceptance */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I have read and agree to the terms and conditions of this employment agreement
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Digital Signature */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Digital Signature</CardTitle>
              <p className="text-sm text-muted-foreground">
                Please provide your digital signature to complete the agreement
              </p>
            </CardHeader>
            <CardContent>
              {!digitalSignature ? (
                <div className="space-y-4">
                  {!showSignature ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowSignature(true)}
                      disabled={!agreedToTerms || !documentGenerated}
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Add Digital Signature
                    </Button>
                  ) : (
                    <DigitalSignaturePad
                      onComplete={handleSignatureComplete}
                      onCancel={() => setShowSignature(false)}
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-foreground">Signature Complete</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your digital signature has been captured successfully.
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowSignature(true)}
                    className="w-full"
                  >
                    Update Signature
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button 
          onClick={handleComplete}
          disabled={!isComplete}
          className="px-8"
        >
          Complete Preboarding
        </Button>
      </div>
    </div>
  );
}
