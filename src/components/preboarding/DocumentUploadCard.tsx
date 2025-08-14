
import React, { useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, X, AlertCircle, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  required: boolean;
  file?: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
  acceptedTypes?: string[];
}

export function DocumentUploadCard({
  title,
  description,
  icon: Icon,
  required,
  file,
  status,
  onFileUpload,
  onFileRemove,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
}: DocumentUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileValidation(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileValidation(e.target.files[0]);
    }
  };

  const handleFileValidation = (selectedFile: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!acceptedTypes.includes(selectedFile.type)) {
      const typeNames = acceptedTypes.map(type => {
        switch(type) {
          case 'application/pdf': return 'PDF';
          case 'image/jpeg':
          case 'image/jpg': return 'JPG';
          case 'image/png': return 'PNG';
          default: return type;
        }
      }).join(', ');
      alert(`Please upload a ${typeNames} file.`);
      return;
    }

    if (selectedFile.size > maxSize) {
      alert('File size must be less than 5MB.');
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    onFileUpload(selectedFile);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'uploading': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-background';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'uploading': return <Upload className="w-5 h-5 text-blue-600 animate-pulse" />;
      default: return <Icon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className={cn("transition-all duration-200", getStatusColor())}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground">{title}</h4>
              {required && <span className="text-red-500 text-sm">*</span>}
            </div>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>

            {status === 'pending' && (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                  dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Drag & drop your file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, PNG (max 5MB)
                </p>
              </div>
            )}

            {status === 'uploading' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">Uploading...</span>
                  <span className="text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {status === 'success' && file && (
              <div className="bg-background rounded-lg p-3 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onFileRemove}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">Upload failed. Please try again.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  Retry Upload
                </Button>
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
