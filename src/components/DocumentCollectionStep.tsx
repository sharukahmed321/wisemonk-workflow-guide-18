
import React from 'react';
import { GraduationCap, FileText, Receipt, FileUser, Plane } from 'lucide-react';
import { Label } from './ui/label';
import { useOnboardingContext } from './EmployeeOnboardingFlow';
import { FileUploadZone } from './FileUploadZone';

const DOCUMENTS = [{
  key: 'graduationCert' as const,
  title: 'Certificate of Graduation/Diploma',
  description: 'Your highest degree certificate or diploma',
  icon: GraduationCap,
  required: true
}, {
  key: 'relievingLetter' as const,
  title: 'Relieving Letter from Last Employer',
  description: 'Official relieving letter from your previous company',
  icon: FileText,
  required: false
}, {
  key: 'resume' as const,
  title: 'Latest Resume',
  description: 'Your most up-to-date CV or resume',
  icon: FileUser,
  required: true
}, {
  key: 'passport' as const,
  title: 'Passport',
  description: 'Copy of your passport (if available)',
  icon: Plane,
  required: false
}];

export function DocumentCollectionStep() {
  const {
    data,
    updateDocuments,
    errors
  } = useOnboardingContext();

  const handleFileChange = (documentKey: keyof typeof data.documentCollection, file: File | null) => {
    updateDocuments({
      [documentKey]: file || undefined
    });
  };

  return <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Upload Your Professional Documents
        </h3>
        <p className="text-muted-foreground">
          Please upload the required documents marked with an asterisk (*). 
          Other documents are optional but recommended for a complete profile.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {DOCUMENTS.map(document => {
        const Icon = document.icon;
        const hasError = errors[document.key];
        return <div key={document.key} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm font-medium text-foreground">
                      {document.title}
                    </Label>
                    {document.required && (
                      <span className="text-destructive text-sm font-medium">*</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {document.description}
                    {document.required && (
                      <span className="text-destructive"> (Required)</span>
                    )}
                  </p>
                  {hasError && (
                    <p className="text-xs text-destructive mt-1">
                      {hasError}
                    </p>
                  )}
                </div>
              </div>
              
              <FileUploadZone 
                onFileSelect={file => handleFileChange(document.key, file)} 
                currentFile={data.documentCollection[document.key]} 
                placeholder="Upload document" 
                description="PDF, JPG, PNG up to 5MB" 
                accept={{
                  'application/pdf': ['.pdf'],
                  'image/*': ['.jpg', '.jpeg', '.png']
                }}
                hasError={!!hasError}
              />
            </div>;
      })}
      </div>
    </div>;
}
