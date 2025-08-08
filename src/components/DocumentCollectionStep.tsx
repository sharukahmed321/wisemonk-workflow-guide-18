import React from 'react';
import { GraduationCap, FileText, Receipt, FileUser, Plane } from 'lucide-react';
import { Label } from './ui/label';
import { useOnboardingContext } from './EmployeeOnboardingFlow';
import { FileUploadZone } from './FileUploadZone';

const DOCUMENTS = [{
  key: 'graduationCert' as const,
  title: 'Certificate of Graduation/Diploma',
  description: 'Your highest degree certificate or diploma',
  icon: GraduationCap
}, {
  key: 'relievingLetter' as const,
  title: 'Relieving Letter from Last Employer',
  description: 'Official relieving letter from your previous company',
  icon: FileText
}, {
  key: 'salarySlip' as const,
  title: 'Last Salary Slip',
  description: 'Most recent salary slip from your previous employer',
  icon: Receipt
}, {
  key: 'resume' as const,
  title: 'Latest Resume',
  description: 'Your most up-to-date CV or resume',
  icon: FileUser
}, {
  key: 'passport' as const,
  title: 'Passport',
  description: 'Copy of your passport (if available)',
  icon: Plane
}];

export function DocumentCollectionStep() {
  const {
    data,
    updateDocuments
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
          These documents help us verify your background and set up your records. 
          All uploads are optional but recommended for a complete profile.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {DOCUMENTS.map(document => {
        const Icon = document.icon;
        return <div key={document.key} className="space-y-3">
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
              
              <FileUploadZone onFileSelect={file => handleFileChange(document.key, file)} currentFile={data.documentCollection[document.key]} placeholder="Upload document" description="PDF, JPG, PNG up to 5MB" accept={{
            'application/pdf': ['.pdf'],
            'image/*': ['.jpg', '.jpeg', '.png']
          }} />
            </div>;
      })}
      </div>

      
    </div>;
}
