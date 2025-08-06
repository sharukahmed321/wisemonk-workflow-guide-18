import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Eye, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  File,
  FileText,
  Image as ImageIcon,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  type: string;
  category: 'KYC' | 'Employment' | 'Personal';
  status: 'pending-upload' | 'uploaded' | 'under-review' | 'approved' | 'rejected';
  uploadedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  size?: number;
  version: number;
  versions?: DocumentVersion[];
  required: boolean;
  description: string;
}

interface DocumentVersion {
  id: string;
  version: number;
  uploadedAt: Date;
  uploadedBy: string;
  size: number;
  notes?: string;
}

interface DocumentManagementProps {
  employeeId: string;
  canManageDocuments: boolean;
  canApproveDocuments: boolean;
}

export function DocumentManagement({ employeeId, canManageDocuments, canApproveDocuments }: DocumentManagementProps) {
  const { toast } = useToast();
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<string>>(new Set());
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  // Mock document data - in real app, this would come from props or API
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Aadhaar Card',
      type: 'ID Proof',
      category: 'KYC',
      status: 'approved',
      uploadedAt: new Date('2024-01-15'),
      approvedAt: new Date('2024-01-16'),
      size: 2456789,
      version: 1,
      required: true,
      description: 'Government issued identity document'
    },
    {
      id: '2',
      name: 'PAN Card',
      type: 'Tax Document',
      category: 'KYC',
      status: 'approved',
      uploadedAt: new Date('2024-01-15'),
      approvedAt: new Date('2024-01-16'),
      size: 1234567,
      version: 1,
      required: true,
      description: 'Permanent Account Number for tax purposes'
    },
    {
      id: '3',
      name: 'Previous Employment Letter',
      type: 'Employment Proof',
      category: 'Employment',
      status: 'under-review',
      uploadedAt: new Date('2024-01-20'),
      size: 567890,
      version: 1,
      required: false,
      description: 'Previous employer verification document'
    },
    {
      id: '4',
      name: 'Educational Certificate',
      type: 'Qualification',
      category: 'Personal',
      status: 'pending-upload',
      version: 0,
      required: true,
      description: 'Highest educational qualification certificate'
    },
    {
      id: '5',
      name: 'Address Proof',
      type: 'Residence',
      category: 'KYC',
      status: 'rejected',
      uploadedAt: new Date('2024-01-18'),
      rejectedAt: new Date('2024-01-19'),
      rejectionReason: 'Document is not clear. Please upload a higher quality image.',
      size: 3456789,
      version: 1,
      required: true,
      description: 'Proof of current residential address'
    }
  ]);

  const getDocumentsByCategory = (category: string) => {
    return documents.filter(doc => doc.category === category);
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'under-review':
        return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'uploaded':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'pending-upload':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'under-review':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'uploaded':
        return <AlertCircle className="h-4 w-4" />;
      case 'pending-upload':
        return <Upload className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-destructive" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon className="h-5 w-5 text-primary" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (documentId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingDocuments(prev => new Set([...prev, documentId]));
    
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update document status
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? {
              ...doc,
              status: 'uploaded' as const,
              uploadedAt: new Date(),
              size: file.size,
              name: file.name,
              version: doc.version + 1
            }
          : doc
      ));
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleApprove = (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? {
            ...doc,
            status: 'approved' as const,
            approvedAt: new Date()
          }
        : doc
    ));
    
    toast({
      title: "Document approved",
      description: "The document has been approved successfully",
    });
  };

  const handleReject = (documentId: string, reason: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? {
            ...doc,
            status: 'rejected' as const,
            rejectedAt: new Date(),
            rejectionReason: reason
          }
        : doc
    ));
    
    toast({
      title: "Document rejected",
      description: "The document has been rejected",
      variant: "destructive",
    });
  };

  const DocumentCard = ({ document }: { document: Document }) => {
    const isUploading = uploadingDocuments.has(document.id);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(document.name)}
              <div>
                <CardTitle className="text-base">{document.name}</CardTitle>
                <CardDescription className="text-sm">
                  {document.type} • {document.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge className={cn("text-xs", getStatusColor(document.status))}>
                {getStatusIcon(document.status)}
                <span className="ml-1 capitalize">{document.status.replace('-', ' ')}</span>
              </Badge>
              {document.required && (
                <Badge variant="outline" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {document.uploadedAt && (
            <div className="text-sm text-muted-foreground">
              <p>Uploaded: {document.uploadedAt.toLocaleDateString()}</p>
              {document.size && <p>Size: {formatFileSize(document.size)}</p>}
              {document.version > 0 && <p>Version: {document.version}</p>}
            </div>
          )}
          
          {document.status === 'rejected' && document.rejectionReason && (
            <Alert className="border-destructive/50 text-destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {document.rejectionReason}
              </AlertDescription>
            </Alert>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <Progress value={75} className="h-2" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {(document.status === 'pending-upload' || document.status === 'rejected') && canManageDocuments && (
              <div>
                <input
                  type="file"
                  id={`upload-${document.id}`}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(document.id, e.target.files)}
                  disabled={isUploading}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => window.document.getElementById(`upload-${document.id}`)?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {document.status === 'rejected' ? 'Re-upload' : 'Upload'}
                </Button>
              </div>
            )}
            
            {document.status !== 'pending-upload' && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => setSelectedDocument(document)}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{document.name}</DialogTitle>
                      <DialogDescription>
                        {document.type} • Version {document.version}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-8 text-center">
                        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Document preview would appear here</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </>
            )}
            
            {document.status === 'under-review' && canApproveDocuments && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApprove(document.id)}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(document.id, 'Document requires revision')}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const DocumentCategory = ({ category, title, description }: { 
    category: string; 
    title: string; 
    description: string; 
  }) => {
    const categoryDocs = getDocumentsByCategory(category);
    const completedDocs = categoryDocs.filter(doc => doc.status === 'approved').length;
    const totalDocs = categoryDocs.length;
    const progress = totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{completedDocs}/{totalDocs} Complete</p>
            <Progress value={progress} className="w-32 h-2 mt-1" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {categoryDocs.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="kyc" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kyc" className="space-y-6">
          <DocumentCategory
            category="KYC"
            title="KYC Documents"
            description="Identity verification and compliance documents"
          />
        </TabsContent>
        
        <TabsContent value="employment" className="space-y-6">
          <DocumentCategory
            category="Employment"
            title="Employment Documents"
            description="Job-related documents and agreements"
          />
        </TabsContent>
        
        <TabsContent value="personal" className="space-y-6">
          <DocumentCategory
            category="Personal"
            title="Personal Documents"
            description="Educational and personal documentation"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}