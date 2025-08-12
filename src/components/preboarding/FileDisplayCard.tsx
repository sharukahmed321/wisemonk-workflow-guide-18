import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Trash2, Check } from 'lucide-react';

interface FileDisplayCardProps {
  fileName: string;
  fileSize: number;
  uploadedAt?: string;
  uploadedUrl?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  onDownload?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function FileDisplayCard({
  fileName,
  fileSize,
  uploadedAt,
  uploadedUrl,
  status,
  onDownload,
  onRemove,
  showRemove = true
}: FileDisplayCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{fileName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatFileSize(fileSize)}</span>
                {uploadedAt && (
                  <>
                    <span>•</span>
                    <span>Uploaded {formatDate(uploadedAt)}</span>
                  </>
                )}
                {status === 'success' && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="w-3 h-3" />
                      <span>Uploaded</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {uploadedUrl && onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="h-8 w-8 p-0"
              >
                <Download className="w-3 h-3" />
              </Button>
            )}
            
            {showRemove && onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}