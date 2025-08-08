
import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, File, Image } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileSelect: (file: File | null) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  currentFile?: File;
  placeholder?: string;
  description?: string;
  showPreview?: boolean;
  className?: string;
}

export function FileUploadZone({
  onFileSelect,
  accept = { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
  maxSize = 5 * 1024 * 1024, // 5MB default
  currentFile,
  placeholder = "Click to upload or drag and drop",
  description = "PDF, JPG, PNG up to 5MB",
  showPreview = false,
  className
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file size
    if (file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }
    
    // Validate file type
    const acceptedTypes = Object.values(accept).flat();
    const isValidType = acceptedTypes.some(type => 
      file.name.toLowerCase().endsWith(type.replace('.', ''))
    );
    
    if (!isValidType) {
      alert(`Please upload a valid file type: ${acceptedTypes.join(', ')}`);
      return;
    }

    onFileSelect(file);
    
    // Create preview for images
    if (showPreview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = () => {
    onFileSelect(null);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = currentFile?.type.startsWith('image/');

  return (
    <div className={cn("space-y-2", className)}>
      {!currentFile ? (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-colors cursor-pointer hover:border-primary/50",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            "p-6"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleInputChange}
            accept={Object.keys(accept).join(',')}
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">
              {placeholder}
            </p>
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            {showPreview && isImage && preview ? (
              <img
                src={preview}
                alt="Preview"
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                {isImage ? (
                  <Image className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <File className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            )}
            
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {currentFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(currentFile.size)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle className="h-3 w-3 text-primary" />
                <span className="text-xs text-primary">Uploaded successfully</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
