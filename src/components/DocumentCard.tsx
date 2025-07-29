import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload, Download, Eye, AlertCircle, CheckCircle, Clock, FileText, MoreVertical } from 'lucide-react';
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
      return <FileText className="w-4 h-4 text-gray-400" />;
  }
};
const getStatusColor = (status: string) => {
  switch (status) {
    case 'verified':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'expired':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'pending':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
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
  const handleView = () => {
    console.log('View document:', title);
  };
  const handleDownload = () => {
    console.log('Download document:', title);
  };
  return <div className="bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
        </div>
        
        <div className="flex items-center gap-2">
          
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {hasFile ? <>
                  <DropdownMenuItem onClick={handleView}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleUpload} disabled={isUploading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Re-upload'}
                  </DropdownMenuItem>
                </> : <DropdownMenuItem onClick={handleUpload} disabled={isUploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                </DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      
    </div>;
}