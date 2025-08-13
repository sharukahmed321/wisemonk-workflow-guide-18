import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentsSection } from '@/components/documents/DocumentsSection';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmployee } from '@/hooks/useEmployee';
import { EmployeeDocument } from '@/data/employeeDocuments';

// Helper function to transform employee document URLs into EmployeeDocument format
const transformEmployeeDocuments = (employee: any): EmployeeDocument[] => {
  const documents: EmployeeDocument[] = [];
  
  if (employee.panCardUrl) {
    documents.push({
      id: `pan-${employee.id}`,
      employeeId: employee.employeeId,
      name: 'PAN Card',
      type: 'pdf',
      category: 'KYC',
      status: 'uploaded',
      uploadDate: new Date().toISOString().split('T')[0],
      fileUrl: employee.panCardUrl,
      required: true,
    });
  }
  
  if (employee.previousPayslipsUrl) {
    documents.push({
      id: `payslips-${employee.id}`,
      employeeId: employee.employeeId,
      name: 'Previous Payslips',
      type: 'pdf',
      category: 'Personal',
      status: 'uploaded',
      uploadDate: new Date().toISOString().split('T')[0],
      fileUrl: employee.previousPayslipsUrl,
      required: true,
    });
  }
  
  if (employee.previousOfferLetterUrl) {
    documents.push({
      id: `offer-letter-${employee.id}`,
      employeeId: employee.employeeId,
      name: 'Previous Offer Letter',
      type: 'pdf',
      category: 'Personal',
      status: 'uploaded',
      uploadDate: new Date().toISOString().split('T')[0],
      fileUrl: employee.previousOfferLetterUrl,
      required: true,
    });
  }
  
  return documents;
};

export default function EmployeeProfile() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { employee, loading, error } = useEmployee(employeeId);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 lg:space-y-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/people')}
            className="mb-4 md:mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to People
          </Button>
          
          <Card>
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                <Skeleton className="h-16 w-16 sm:h-20 w-20 md:h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Employee</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => navigate('/dashboard/people')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Employee Not Found</h1>
        <p className="text-muted-foreground mb-4">The employee you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/dashboard/people')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Button>
      </div>
    );
  }

  // Role-based access check
  const canViewProfile = permissions.canViewAllEmployees || permissions.employeeId === employee.employeeId;
  
  if (!canViewProfile) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You don't have permission to view this profile.</p>
        <Button onClick={() => navigate('/dashboard/people')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Button>
      </div>
    );
  }

  const statusColors = {
    Active: 'bg-success/10 text-success border-success/20',
    Onboarding: 'bg-primary/10 text-primary border-primary/20',
    Preboarding: 'bg-warning/10 text-warning-foreground border-warning/20',
    Exit: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  // Get the profile picture URL from the employee data
  const profilePictureUrl = employee.avatar;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 lg:space-y-8">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/people')}
            className="mb-4 md:mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to People
          </Button>
          
          <Card>
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                <Avatar className="h-16 w-16 sm:h-20 w-20 md:h-24 w-24">
                  <AvatarImage src={profilePictureUrl} alt={`${employee.firstName} ${employee.lastName}`} />
                  <AvatarFallback className="text-lg md:text-xl">
                    {employee.firstName[0]}{employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4 md:space-y-6 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground break-words">
                        {employee.firstName} {employee.lastName}
                      </h1>
                      <p className="text-muted-foreground text-lg md:text-xl break-words">{employee.jobTitle}</p>
                      <p className="text-sm text-muted-foreground break-words">
                        {employee.employeeId} • {employee.department}
                      </p>
                    </div>
                    
                    <Badge className={statusColors[employee.status]}>
                      {employee.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground min-w-0">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="break-all">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground min-w-0">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">{employee.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground min-w-0">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">Started {new Date(employee.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground min-w-0">
                      <Building className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">{employee.employmentType}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="h-auto bg-transparent border-b border-border p-0 gap-2 sm:gap-4 lg:gap-8 mb-6 md:mb-8 overflow-x-auto">
            <TabsTrigger 
              value="overview" 
              className="bg-transparent border-0 rounded-none px-2 sm:px-4 pb-3 md:pb-4 pt-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium hover:text-foreground text-sm sm:text-base whitespace-nowrap"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="bg-transparent border-0 rounded-none px-2 sm:px-4 pb-3 md:pb-4 pt-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium hover:text-foreground text-sm sm:text-base whitespace-nowrap"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="leaves" 
              className="bg-transparent border-0 rounded-none px-2 sm:px-4 pb-3 md:pb-4 pt-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium hover:text-foreground text-sm sm:text-base whitespace-nowrap"
            >
              Leaves
            </TabsTrigger>
            <TabsTrigger 
              value="finance" 
              className="bg-transparent border-0 rounded-none px-2 sm:px-4 pb-3 md:pb-4 pt-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium hover:text-foreground text-sm sm:text-base whitespace-nowrap"
            >
              Finance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Employee Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 md:space-y-8">
                <div className="space-y-6 md:space-y-8">
                  <div className="space-y-4">
                    <div className="pb-2 border-b border-border">
                      <h3 className="font-semibold text-foreground">Personal Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Full Name:</span>
                        <span className="font-medium">{employee.firstName} {employee.lastName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Employee ID:</span>
                        <span className="font-medium">{employee.employeeId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="font-medium break-all">{employee.email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Phone:</span>
                        <span className="font-medium">{employee.phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="pb-2 border-b border-border">
                      <h3 className="font-semibold text-foreground">Employment Details</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Job Title:</span>
                        <span className="font-medium">{employee.jobTitle}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Department:</span>
                        <span className="font-medium">{employee.department}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Employment Type:</span>
                        <span className="font-medium">{employee.employmentType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Start Date:</span>
                        <span className="font-medium">{new Date(employee.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge className={statusColors[employee.status]}>
                          {employee.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <DocumentsSection 
              documents={transformEmployeeDocuments(employee)} 
              employeeId={employee.employeeId}
            />
          </TabsContent>

          <TabsContent value="leaves" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Leave Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Leave management functionality coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Finance & Payroll</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Finance and payroll information coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
