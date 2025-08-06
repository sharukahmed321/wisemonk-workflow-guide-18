export interface EmployeeDocument {
  id: string;
  employeeId: string;
  name: string;
  type: string;
  category: 'KYC' | 'Employment' | 'Personal';
  status: 'pending' | 'approved' | 'rejected' | 'uploaded';
  uploadDate?: string;
  approvedDate?: string;
  rejectedDate?: string;
  rejectionReason?: string;
  fileUrl?: string;
  fileSize?: number;
  required: boolean;
}

export const mockEmployeeDocuments: EmployeeDocument[] = [
  // Documents for EMP001 (John Doe)
  {
    id: 'doc-1',
    employeeId: 'EMP001',
    name: 'Aadhaar Card',
    type: 'pdf',
    category: 'KYC',
    status: 'approved',
    uploadDate: '2023-01-10',
    approvedDate: '2023-01-12',
    fileSize: 245760,
    required: true
  },
  {
    id: 'doc-2',
    employeeId: 'EMP001',
    name: 'PAN Card',
    type: 'pdf',
    category: 'KYC',
    status: 'approved',
    uploadDate: '2023-01-10',
    approvedDate: '2023-01-12',
    fileSize: 189440,
    required: true
  },
  {
    id: 'doc-3',
    employeeId: 'EMP001',
    name: 'Employment Agreement',
    type: 'pdf',
    category: 'Employment',
    status: 'approved',
    uploadDate: '2023-01-15',
    approvedDate: '2023-01-16',
    fileSize: 512000,
    required: true
  },
  {
    id: 'doc-4',
    employeeId: 'EMP001',
    name: 'Bank Account Details',
    type: 'pdf',
    category: 'Personal',
    status: 'approved',
    uploadDate: '2023-01-18',
    approvedDate: '2023-01-20',
    fileSize: 156672,
    required: true
  },
  
  // Documents for EMP002 (Jane Smith)
  {
    id: 'doc-5',
    employeeId: 'EMP002',
    name: 'Aadhaar Card',
    type: 'pdf',
    category: 'KYC',
    status: 'approved',
    uploadDate: '2023-03-15',
    approvedDate: '2023-03-17',
    fileSize: 267264,
    required: true
  },
  {
    id: 'doc-6',
    employeeId: 'EMP002',
    name: 'PAN Card',
    type: 'pdf',
    category: 'KYC',
    status: 'pending',
    uploadDate: '2023-03-15',
    fileSize: 201728,
    required: true
  },
  {
    id: 'doc-7',
    employeeId: 'EMP002',
    name: 'Employment Agreement',
    type: 'pdf',
    category: 'Employment',
    status: 'approved',
    uploadDate: '2023-03-20',
    approvedDate: '2023-03-22',
    fileSize: 478208,
    required: true
  },
  
  // Documents for EMP003 (Mike Johnson)
  {
    id: 'doc-8',
    employeeId: 'EMP003',
    name: 'Aadhaar Card',
    type: 'pdf',
    category: 'KYC',
    status: 'rejected',
    uploadDate: '2023-06-05',
    rejectedDate: '2023-06-07',
    rejectionReason: 'Document quality is poor, please upload a clearer image',
    fileSize: 156672,
    required: true
  },
  {
    id: 'doc-9',
    employeeId: 'EMP003',
    name: 'PAN Card',
    type: 'pdf',
    category: 'KYC',
    status: 'uploaded',
    uploadDate: '2023-06-08',
    fileSize: 223232,
    required: true
  },
  
  // Documents for EMP004 (Sarah Wilson)
  {
    id: 'doc-10',
    employeeId: 'EMP004',
    name: 'Aadhaar Card',
    type: 'pdf',
    category: 'KYC',
    status: 'pending',
    required: true
  },
  {
    id: 'doc-11',
    employeeId: 'EMP004',
    name: 'PAN Card',
    type: 'pdf',
    category: 'KYC',
    status: 'pending',
    required: true
  },
  {
    id: 'doc-12',
    employeeId: 'EMP004',
    name: 'Employment Agreement',
    type: 'pdf',
    category: 'Employment',
    status: 'pending',
    required: true
  }
];