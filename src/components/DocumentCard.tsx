import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Eye, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
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
      return;
    case 'expired':
      return;
    case 'pending':
      return;
    default:
      return <FileText className="w-4 h-4 text-gray-400" />;
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
  return <div className="bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
        </div>
        
      </div>
      
      <div className="space-y-2 mb-4">
        {uploadedDate && <p className="text-xs text-gray-500">
            Uploaded: {uploadedDate}
          </p>}
        
        {expiryDate && <p className="text-xs text-gray-500">
            Expires: {expiryDate}
          </p>}
      </div>
      
      <div className="flex items-center gap-2">
        {hasFile ? <>
            <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs h-8">
              <Eye className="w-3 h-3" />
              View
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs h-8">
              <Download className="w-3 h-3" />
              Download
            </Button>
          </> : <Button variant="outline" size="sm" onClick={handleUpload} disabled={isUploading} className="flex items-center gap-1 text-xs h-8">
            <Upload className="w-3 h-3" />
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>}
      </div>
    </div>;
}