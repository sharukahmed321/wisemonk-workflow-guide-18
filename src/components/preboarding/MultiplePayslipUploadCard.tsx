import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle, X, Receipt, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PayslipData {
  file?: File;
  fileName?: string;
  fileSize?: number;
  uploadedUrl?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

interface MultiplePayslipUploadCardProps {
  payslips: {
    payslip1: PayslipData;
    payslip2: PayslipData;
    payslip3: PayslipData;
  };
  onPayslipUpdate: (payslipNumber: 1 | 2 | 3, data: PayslipData) => void;
  employeeId: string;
}

export function MultiplePayslipUploadCard({ payslips, onPayslipUpdate, employeeId }: MultiplePayslipUploadCardProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleMultipleFilesUpload = async (files: FileList) => {
    if (files.length !== 3) {
      toast({
        title: "Invalid file count",
        description: "Please select exactly 3 payslip files.",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Validate all files first
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `File "${file.name}" is not a PDF, JPG, or PNG file.`,
          variant: "destructive",
        });
        return;
      }
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `File "${file.name}" is larger than 5MB.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsUploading(true);

    // Set all files to uploading status
    const filesArray = Array.from(files);
    filesArray.forEach((file, index) => {
      onPayslipUpdate((index + 1) as 1 | 2 | 3, { file, status: 'uploading' });
    });

    // Upload all files concurrently
    const uploadPromises = filesArray.map(async (file, index) => {
      const payslipNumber = (index + 1) as 1 | 2 | 3;
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('employeeId', employeeId);
        formData.append('documentType', `payslip_${payslipNumber}`);

        const { data, error } = await supabase.functions.invoke('upload-employee-document', {
          body: formData
        });

        if (error) {
          throw error;
        }

        onPayslipUpdate(payslipNumber, { 
          file, 
          fileName: file.name,
          fileSize: file.size,
          uploadedUrl: data?.url || '',
          status: 'success' 
        });
        return { success: true, payslipNumber };
      } catch (error) {
        console.error(`Upload error for payslip ${payslipNumber}:`, error);
        onPayslipUpdate(payslipNumber, { file, status: 'error' });
        return { success: false, payslipNumber, error };
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      if (successCount === 3) {
        toast({
          title: "All payslips uploaded successfully",
          description: "All 3 payslips have been uploaded and are pending verification.",
        });
      } else if (successCount > 0) {
        toast({
          title: "Partial upload success",
          description: `${successCount} of 3 payslips uploaded successfully. ${failedCount} failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload failed",
          description: "Failed to upload any payslips. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileRemove = (payslipNumber: 1 | 2 | 3) => {
    onPayslipUpdate(payslipNumber, { status: 'pending' });
  };

  const handleChooseFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (files) {
        handleMultipleFilesUpload(files);
      }
    };
    input.click();
  };

  const handleResetFiles = () => {
    onPayslipUpdate(1, { status: 'pending' });
    onPayslipUpdate(2, { status: 'pending' });
    onPayslipUpdate(3, { status: 'pending' });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: PayslipData['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'uploading': return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default: return <Upload className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const hasAnyFiles = payslips.payslip1.fileName || payslips.payslip2.fileName || payslips.payslip3.fileName;
  const allFilesSelected = payslips.payslip1.fileName && payslips.payslip2.fileName && payslips.payslip3.fileName;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Previous Payslips</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload your last 3 months payslips (all 3 required)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnyFiles ? (
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={handleChooseFiles}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Upload Payslips</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Click to select all 3 payslip files at once
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG (max 5MB each)
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              disabled={isUploading}
            >
              Choose 3 Files
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Selected Payslips</h3>
              {allFilesSelected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFiles}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Choose Different Files
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {[1, 2, 3].map((num) => {
                const payslipKey = `payslip${num}` as keyof typeof payslips;
                const payslipData = payslips[payslipKey];
                
                return (
                  <div 
                    key={num}
                    className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-xs font-medium text-primary">
                      {num}
                    </div>
                    
                    {payslipData.fileName ? (
                      <>
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {payslipData.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payslipData.fileSize ? formatFileSize(payslipData.fileSize) : 'Unknown size'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payslipData.status)}
                          {payslipData.status === 'success' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFileRemove(num as 1 | 2 | 3)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            No file selected
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            
            {!allFilesSelected && (
              <Button 
                variant="outline" 
                onClick={handleChooseFiles}
                disabled={isUploading}
                className="w-full"
              >
                {hasAnyFiles ? 'Replace Files' : 'Choose Files'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}