
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface DocumentCardProps {
  title: string;
  type: 'identity' | 'employment' | 'compliance';
  status: 'pending' | 'verified' | 'expired' | 'not_uploaded';
  uploadedDate?: string;
  expiryDate?: string;
  hasFile?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'verified':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'expired':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-600" />;
    default:
      return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'verified':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function DocumentCard({ 
  title, 
  type, 
  status, 
  uploadedDate, 
  expiryDate, 
  hasFile = false 
}: DocumentCardProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
    }, 2000);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {getStatusIcon(status)}
          </div>
          <Badge className={getStatusColor(status)}>
            {status.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {uploadedDate && (
            <p className="text-sm text-gray-600">
              Uploaded: {uploadedDate}
            </p>
          )}
          
          {expiryDate && (
            <p className="text-sm text-gray-600">
              Expires: {expiryDate}
            </p>
          )}
          
          <div className="flex items-center gap-2 pt-2">
            {hasFile ? (
              <>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-1"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
