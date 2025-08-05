
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { User, Mail, Calendar, Building, DollarSign, MapPin } from 'lucide-react';

interface EmployeeRecord {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  start_date: string;
  department?: string;
  job_title?: string;
  employment_type?: string;
  salary?: number;
  currency?: string;
  phone?: string;
  work_location?: string;
  seniority?: string;
}

interface EmployeeProfileProps {
  employeeId?: string;
}

export function EmployeeProfile({ employeeId }: EmployeeProfileProps) {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isViewingOwnProfile = !employeeId;

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeById(employeeId);
    } else if (user) {
      fetchCurrentUserProfile();
    }
  }, [employeeId, user]);

  const fetchEmployeeById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, employee_id, first_name, last_name, email, status, start_date, 
          department, job_title, employment_type, salary, currency, phone, 
          work_location, seniority
        `)
        .eq('id', id)
        .single();

      if (error) {
        setError('Failed to load employee information.');
        return;
      }

      setEmployee(data);
    } catch (err) {
      console.error('Error fetching employee profile:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, employee_id, first_name, last_name, email, status, start_date, 
          department, job_title, employment_type, salary, currency, phone, 
          work_location, seniority
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        setError('Failed to load profile information.');
        return;
      }

      setEmployee(data);
    } catch (err) {
      console.error('Error fetching employee profile:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Profile Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {isViewingOwnProfile ? 'My Profile' : `${employee.first_name} ${employee.last_name}`}
        </h1>
        <p className="text-muted-foreground">
          {isViewingOwnProfile 
            ? 'View and manage your profile information'
            : 'Employee profile information'
          }
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            {isViewingOwnProfile ? 'Your personal and employment details' : 'Employee personal and employment details'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{employee.email}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{employee.employee_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {new Date(employee.start_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Employment Information */}
          {(employee.department || employee.job_title || employee.employment_type || employee.work_location) && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground mb-4">Employment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {employee.department && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{employee.department}</p>
                    </div>
                  </div>
                )}
                {employee.job_title && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Job Title</p>
                      <p className="font-medium">{employee.job_title}</p>
                    </div>
                  </div>
                )}
                {employee.employment_type && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Employment Type</p>
                      <p className="font-medium">{employee.employment_type}</p>
                    </div>
                  </div>
                )}
                {employee.work_location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Work Location</p>
                      <p className="font-medium">{employee.work_location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {employee.phone && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground mb-4">Contact Information</h4>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{employee.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Compensation Information (only for own profile or managers) */}
          {(employee.salary && employee.currency) && isViewingOwnProfile && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground mb-4">Compensation</h4>
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p className="font-medium">
                    {employee.currency} {employee.salary?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status and Additional Info */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  employee.status === 'Active' ? 'bg-success' : 'bg-warning'
                }`} />
                <span className="text-sm font-medium">Status: {employee.status}</span>
              </div>
              {employee.seniority && (
                <span className="text-sm text-muted-foreground">
                  Seniority: {employee.seniority}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
