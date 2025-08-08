
import React from 'react';
import { GraduationCap, FileText, Receipt, FileUser, Plane } from 'lucide-react';
import { Label } from './ui/label';
import { useOnboardingContext } from './EmployeeOnboardingFlow';
import { FileUploadZone } from './FileUploadZone';

const DOCUMENTS = [
  {
    key: 'graduationCert' as const,
    title: 'Certificate of Graduation/Diploma',
    description: 'Your highest degree certificate or diploma',
    icon: GraduationCap,
  },
  {
    key: 'relievingLetter' as const,
    title: 'Relieving Letter from Last Employer',
    description: 'Official relieving letter from your previous company',
    icon: FileText,
  },
  {
    key: 'salarySlip' as const,
    title: 'Last Salary Slip',
    description: 'Most recent salary slip from your previous employer',
    icon: Receipt,
  },
  {
    key: 'resume' as const,
    title: 'Latest Resume',
    description: 'Your most up-to-date CV or resume',
    icon: FileUser,
  },
  {
    key: 'passport' as const,
    title: 'Passport',
    description: 'Copy of your passport (if available)',
    icon: Plane,
  },
];

export function DocumentCollectionStep() {
  const { data, updateDocuments } = useOnboardingContext();
  
  const handleFileChange = (documentKey: keyof typeof data.documentCollection, file: File | null) => {
    updateDocuments({ [documentKey]: file || undefined });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Upload Your Professional Documents
        </h3>
        <p className="text-muted-foreground">
          These documents help us verify your background and set up your employee records. 
          All uploads are optional but recommended for a complete profile.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {DOCUMENTS.map((document) => {
          const Icon = document.icon;
          return (
            <div key={document.key} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <Label className="text-sm font-medium text-foreground">
                    {document.title}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {document.description}
                  </p>
                </div>
              </div>
              
              <FileUploadZone
                onFileSelect={(file) => handleFileChange(document.key, file)}
                currentFile={data.documentCollection[document.key]}
                placeholder="Upload document"
                description="PDF, JPG, PNG up to 5MB"
                accept={{
                  'application/pdf': ['.pdf'],
                  'image/*': ['.jpg', '.jpeg', '.png']
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border bg-muted/20 p-4">
        <h4 className="font-medium text-foreground mb-2">Document Guidelines</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• All documents should be clear and readable</li>
          <li>• PDF format is preferred for text documents</li>
          <li>• Images should be high quality (JPG or PNG)</li>
          <li>• Maximum file size is 5MB per document</li>
          <li>• You can always upload or replace documents later</li>
        </ul>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <h4 className="font-medium text-primary">Privacy & Security</h4>
        </div>
        <p className="text-sm text-primary/80">
          All uploaded documents are encrypted and stored securely. Only authorized HR personnel 
          can access these documents for verification and onboarding purposes.
        </p>
      </div>
    </div>
  );
}
