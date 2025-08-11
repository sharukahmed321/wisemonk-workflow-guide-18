import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle, X, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PayslipData {
  file?: File;
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

  const handleFileUpload = async (payslipNumber: 1 | 2 | 3, file: File) => {
    // Validate file
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, JPG, or PNG file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Update status to uploading
    onPayslipUpdate(payslipNumber, { file, status: 'uploading' });

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

      onPayslipUpdate(payslipNumber, { file, status: 'success' });
      
      toast({
        title: "Payslip uploaded successfully",
        description: `Payslip ${payslipNumber} has been uploaded and is pending verification.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      onPayslipUpdate(payslipNumber, { file, status: 'error' });
      
      toast({
        title: "Upload failed",
        description: `Failed to upload payslip ${payslipNumber}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleFileRemove = (payslipNumber: 1 | 2 | 3) => {
    onPayslipUpdate(payslipNumber, { status: 'pending' });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: PayslipData['status']) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'uploading': return 'border-blue-200 bg-blue-50';
      default: return 'border-border';
    }
  };

  const getStatusIcon = (status: PayslipData['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'uploading': return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default: return <Upload className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const PayslipUploadSection = ({ 
    payslipNumber, 
    payslipData 
  }: { 
    payslipNumber: 1 | 2 | 3; 
    payslipData: PayslipData 
  }) => (
    <div className={`border-2 border-dashed rounded-lg p-4 transition-colors ${getStatusColor(payslipData.status)}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-foreground">Payslip {payslipNumber}</h4>
        {getStatusIcon(payslipData.status)}
      </div>
      
      {payslipData.file && payslipData.status !== 'pending' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-background rounded border">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {payslipData.file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(payslipData.file.size)}
              </p>
            </div>
            {payslipData.status === 'success' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFileRemove(payslipNumber)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {payslipData.status === 'uploading' && (
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          )}
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.jpg,.jpeg,.png';
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              const file = target.files?.[0];
              if (file) {
                handleFileUpload(payslipNumber, file);
              }
            };
            input.click();
          }}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, JPG, PNG (max 5MB)
          </p>
        </div>
      )}
    </div>
  );

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
        <PayslipUploadSection payslipNumber={1} payslipData={payslips.payslip1} />
        <PayslipUploadSection payslipNumber={2} payslipData={payslips.payslip2} />
        <PayslipUploadSection payslipNumber={3} payslipData={payslips.payslip3} />
      </CardContent>
    </Card>
  );
}