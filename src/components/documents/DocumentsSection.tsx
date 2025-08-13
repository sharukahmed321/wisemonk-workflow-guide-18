import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle 
} from 'lucide-react';
import type { EmployeeDocument } from '@/data/employeeDocuments';

interface DocumentsSectionProps {
  documents: EmployeeDocument[];
  employeeId: string;
}

export function DocumentsSection({ documents, employeeId }: DocumentsSectionProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'uploaded':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'pending':
        return 'bg-warning/10 text-warning-foreground border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'uploaded':
        return <Upload className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentsByCategory = (category: string) => {
    return documents.filter(doc => doc.category === category);
  };

  const getCategoryProgress = (category: string) => {
    const categoryDocs = getDocumentsByCategory(category);
    const requiredDocs = categoryDocs.filter(doc => doc.required);
    const approvedDocs = requiredDocs.filter(doc => doc.status === 'approved');
    return requiredDocs.length > 0 ? (approvedDocs.length / requiredDocs.length) * 100 : 0;
  };

  const categories = [
    { key: 'Employment', label: 'Employment Documents', description: 'Job-related documentation' }
  ];

  return (
    <div className="space-y-6">
      {categories.map(category => {
        const categoryDocs = getDocumentsByCategory(category.key);
        const progress = getCategoryProgress(category.key);
        
        return (
          <Card key={category.key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{category.label}</CardTitle>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{Math.round(progress)}% Complete</p>
                  <Progress value={progress} className="w-24 h-2 mt-1" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {categoryDocs.length > 0 ? (
                <div className="space-y-4">
                  {categoryDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{doc.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{doc.type.toUpperCase()}</span>
                            {doc.fileSize && <span>• {formatFileSize(doc.fileSize)}</span>}
                            {doc.uploadDate && <span>• Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</span>}
                          </div>
                          {doc.status === 'rejected' && doc.rejectionReason && (
                            <p className="text-sm text-destructive mt-1">{doc.rejectionReason}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={`gap-1 ${getStatusColor(doc.status)}`}>
                          {getStatusIcon(doc.status)}
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </Badge>
                        
                        <div className="flex gap-2">
                          {doc.status === 'pending' && (
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-1" />
                              Upload
                            </Button>
                          )}
                          {doc.fileUrl && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No documents in this category.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}