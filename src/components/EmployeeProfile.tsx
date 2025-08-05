
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Mail, Phone, Calendar, Building, FileText, CreditCard, Plane } from 'lucide-react';

interface EmployeeRecord {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title: string;
  department: string;
  employment_type: string;
  salary?: number;
  start_date: string;
  status: string;
  organization_id: string;
  date_of_birth?: string;
  age?: number;
  avatar_url?: string;
  currency?: string;
  work_location?: string;
  seniority?: string;
  user_id?: string;
}

interface EmployeeProfileProps {
  employeeId?: string;
}

const statusColors = {
  Active: 'bg-green-500/10 text-green-600 border-green-500/20',
  Onboarding: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Preboarding: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  Invited: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Exit: 'bg-red-500/10 text-red-600 border-red-500/20',
} as const;

export function EmployeeProfile({ employeeId }: EmployeeProfileProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeById(employeeId);
    } else if (user) {
      fetchCurrentUserProfile();
    }
  }, [employeeId, user]);

  const fetchEmployeeById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching employee:', error);
        setError(error.message);
        return;
      }

      setEmployee(data);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setError(error.message);
        return;
      }

      setEmployee(data);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading employee profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/dashboard/people')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to People
          </Button>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                <p className="font-medium">Error loading employee profile</p>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/dashboard/people')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to People
          </Button>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="font-medium">Employee not found</p>
                <p className="text-sm text-muted-foreground mt-2">The requested employee profile could not be found.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id && employee.user_id === user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Navigation */}
        <Button variant="ghost" onClick={() => navigate('/dashboard/people')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Button>

        {/* Header Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Employee Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24">
                  <AvatarImage src={employee.avatar_url} alt={`${employee.first_name} ${employee.last_name}`} />
                  <AvatarFallback className="text-lg sm:text-xl lg:text-2xl">
                    {getInitials(employee.first_name, employee.last_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {employee.first_name} {employee.last_name}
                  </h1>
                  <p className="text-lg sm:text-xl text-muted-foreground">{employee.job_title}</p>
                  <p className="text-sm text-muted-foreground">
                    {employee.employee_id} • {employee.department}
                  </p>
                  <Badge className={`mt-2 ${getStatusBadgeColor(employee.status)}`}>
                    {employee.status}
                  </Badge>
                </div>
              </div>

              {/* Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:min-w-[300px]">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="break-all">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(employee.start_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.employment_type}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab System */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-transparent border-0 p-0 h-auto">
            <TabsTrigger 
              value="overview" 
              className="bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="leaves" 
              className="bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              <Plane className="mr-2 h-4 w-4" />
              Leaves
            </TabsTrigger>
            <TabsTrigger 
              value="finance" 
              className="bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Finance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Full Name:</span>
                    <span className="font-medium">{employee.first_name} {employee.last_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Employee ID:</span>
                    <span className="font-medium">{employee.employee_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="font-medium break-all">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <span className="font-medium">{employee.phone}</span>
                    </div>
                  )}
                  {employee.date_of_birth && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Date of Birth:</span>
                      <span className="font-medium">{formatDate(employee.date_of_birth)}</span>
                    </div>
                  )}
                  {employee.age && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Age:</span>
                      <span className="font-medium">{employee.age} years</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Job Title:</span>
                    <span className="font-medium">{employee.job_title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Department:</span>
                    <span className="font-medium">{employee.department}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Employment Type:</span>
                    <span className="font-medium">{employee.employment_type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Start Date:</span>
                    <span className="font-medium">{formatDate(employee.start_date)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={getStatusBadgeColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </div>
                  {employee.work_location && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Work Location:</span>
                      <span className="font-medium">{employee.work_location}</span>
                    </div>
                  )}
                  {employee.seniority && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Seniority:</span>
                      <span className="font-medium">{employee.seniority}</span>
                    </div>
                  )}
                  {isOwnProfile && employee.salary && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Salary:</span>
                      <span className="font-medium">
                        {employee.currency || 'USD'} {employee.salary.toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Document management system coming soon</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    KYC documents, employment agreements, and personal files will be managed here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaves Tab */}
          <TabsContent value="leaves">
            <Card>
              <CardHeader>
                <CardTitle>Leave Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Leave management system coming soon</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Track vacation days, sick leave, and other time-off requests here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance">
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Financial management system coming soon</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Salary history, bonuses, and payment information will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
