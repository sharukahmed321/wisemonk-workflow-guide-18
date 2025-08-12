import React, { useState, useCallback } from 'react';
import { validateFileUpload } from '@/lib/dataValidation';
import { FileUploadZone } from './FileUploadZone';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecureFileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  currentFileUrl?: string;
  label?: string;
  required?: boolean;
}

/**
 * Secure file upload component with comprehensive validation
 * Includes security checks, file type validation, and sanitization
 */
export function SecureFileUpload({
  onFileSelect,
  accept = {
    'image/*': [],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  },
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
  className = "",
  currentFileUrl,
  label = "Upload File",
  required = false
}: SecureFileUploadProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = useCallback((file: File) => {
    setValidationError(null);
    setIsValidated(false);

    // Comprehensive security validation
    const validation = validateFileUpload(file);
    
    if (!validation.isValid) {
      setValidationError(validation.error!);
      toast({
        title: "File Upload Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Additional size check (double validation)
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      const error = `File size exceeds ${maxSizeMB}MB limit`;
      setValidationError(error);
      toast({
        title: "File Upload Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    // Check for potentially dangerous file extensions in name
    const dangerousExtensions = ['.exe', '.bat', '.sh', '.scr', '.vbs', '.js', '.php'];
    const fileName = file.name.toLowerCase();
    const hasDangerousExtension = dangerousExtensions.some(ext => fileName.endsWith(ext));
    
    if (hasDangerousExtension) {
      const error = "File type not allowed for security reasons";
      setValidationError(error);
      toast({
        title: "Security Warning",
        description: error,
        variant: "destructive",
      });
      return;
    }

    // Verify MIME type matches file extension (basic spoofing protection)
    const mimeTypeCheck = verifyMimeType(file);
    if (!mimeTypeCheck.isValid) {
      setValidationError(mimeTypeCheck.error!);
      toast({
        title: "File Validation Error",
        description: mimeTypeCheck.error,
        variant: "destructive",
      });
      return;
    }

    setIsValidated(true);
    onFileSelect(file);
    
    toast({
      title: "File Validated",
      description: "File passed all security checks and is ready for upload.",
    });
  }, [maxSize, onFileSelect, toast]);

  const verifyMimeType = (file: File): { isValid: boolean; error?: string } => {
    const extension = file.name.toLowerCase().split('.').pop();
    const mimeType = file.type.toLowerCase();

    // Basic MIME type verification
    const allowedMappings: Record<string, string[]> = {
      'pdf': ['application/pdf'],
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'webp': ['image/webp'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    if (extension && allowedMappings[extension]) {
      if (!allowedMappings[extension].includes(mimeType)) {
        return {
          isValid: false,
          error: `File type mismatch. Expected ${allowedMappings[extension].join(' or ')} but got ${mimeType}`
        };
      }
    }

    return { isValid: true };
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {isValidated && (
          <div className="flex items-center gap-1 text-green-600 text-xs">
            <Shield className="h-3 w-3" />
            <CheckCircle className="h-3 w-3" />
            <span>Validated</span>
          </div>
        )}
      </div>

      <FileUploadZone
        onFileSelect={handleFileSelect}
        accept={accept}
        maxSize={maxSize}
        className={disabled ? 'opacity-50 pointer-events-none' : ''}
      />

      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Security features enabled:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>File type validation</li>
          <li>MIME type verification</li>
          <li>Size limit enforcement</li>
          <li>Malicious file detection</li>
          <li>Extension spoofing protection</li>
        </ul>
      </div>
    </div>
  );
}