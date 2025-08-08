
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DocumentUploadCard } from './DocumentUploadCard';
import { Shield, FileText, CreditCard, Receipt, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BackgroundVerificationData {
  documents: {
    panCard?: File;
    previousPayslips?: File;
    previousOfferLetter?: File;
  };
  uploadStatus: Record<string, 'pending' | 'uploading' | 'success' | 'error'>;
}

interface BackgroundVerificationStepProps {
  data: BackgroundVerificationData;
  onComplete: (data: BackgroundVerificationData) => void;
  onPrevious: () => void;
  employeeId: string;
}

export function BackgroundVerificationStep({ data, onComplete, onPrevious, employeeId }: BackgroundVerificationStepProps) {
  const [documents, setDocuments] = useState(data.documents);
  const [uploadStatus, setUploadStatus] = useState(data.uploadStatus);
  const { toast } = useToast();

  const documentTypes = [
    {
      key: 'panCard',
      title: 'PAN Card',
      description: 'Upload a clear copy of your PAN card',
      icon: CreditCard,
      required: true
    },
    {
      key: 'previousPayslips',
      title: 'Previous Payslips',
      description: 'Upload your last 3 months payslips',
      icon: Receipt,
      required: true
    },
    {
      key: 'previousOfferLetter',
      title: 'Previous Offer Letter',
      description: 'Upload your previous company offer letter',
      icon: Award,
      required: true
    }
  ];

  const handleFileUpload = async (documentType: string, file: File) => {
    setUploadStatus(prev => ({
      ...prev,
      [documentType]: 'uploading'
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('employeeId', employeeId);
      formData.append('documentType', documentType);

      const { data, error } = await supabase.functions.invoke('upload-employee-document', {
        body: formData
      });

      if (error) {
        throw error;
      }

      setDocuments(prev => ({
        ...prev,
        [documentType]: file
      }));
      
      setUploadStatus(prev => ({
        ...prev,
        [documentType]: 'success'
      }));
      
      toast({
        title: "Document uploaded successfully",
        description: `${documentType} has been uploaded and is pending verification.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(prev => ({
        ...prev,
        [documentType]: 'error'
      }));
      
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileRemove = (documentType: string) => {
    setDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[documentType as keyof typeof newDocs];
      return newDocs;
    });
    
    setUploadStatus(prev => ({
      ...prev,
      [documentType]: 'pending'
    }));
  };

  const handleContinue = () => {
    const requiredDocs = documentTypes.filter(doc => doc.required);
    const hasAllRequiredDocs = requiredDocs.every(doc => 
      documents[doc.key as keyof typeof documents] && 
      uploadStatus[doc.key] === 'success'
    );

    if (hasAllRequiredDocs) {
      onComplete({
        documents,
        uploadStatus
      });
    }
  };

  const isComplete = documentTypes
    .filter(doc => doc.required)
    .every(doc => documents[doc.key as keyof typeof documents] && uploadStatus[doc.key] === 'success');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">Background Verification</h3>
        <p className="text-muted-foreground">
          Please upload the required documents for background verification
        </p>
      </div>

      <div className="grid gap-6">
        {documentTypes.map((docType) => (
          <DocumentUploadCard
            key={docType.key}
            title={docType.title}
            description={docType.description}
            icon={docType.icon}
            required={docType.required}
            file={documents[docType.key as keyof typeof documents]}
            status={uploadStatus[docType.key]}
            onFileUpload={(file) => handleFileUpload(docType.key, file)}
            onFileRemove={() => handleFileRemove(docType.key)}
          />
        ))}
      </div>

      <div className="bg-muted/30 rounded-lg p-4 text-sm">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Document Requirements:</p>
            <ul className="text-muted-foreground mt-1 space-y-1">
              <li>• Accepted formats: PDF, JPG, PNG</li>
              <li>• Maximum file size: 5MB per document</li>
              <li>• Ensure documents are clear and readable</li>
              <li>• All required documents must be uploaded to proceed</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!isComplete}
          className="px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
