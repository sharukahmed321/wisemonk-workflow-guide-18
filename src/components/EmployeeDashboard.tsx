
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EmailVerificationGuard } from './EmailVerificationGuard';
import { EmployeeHeader } from './EmployeeHeader';
import { PreboardingFlow } from './PreboardingFlow';
import { EmployeeSidebar } from './EmployeeSidebar';
import { EmployeeProfile } from './EmployeeProfile';
import { EmployeeOnboarding } from './EmployeeOnboarding';
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, Clock, User } from 'lucide-react';

interface EmployeeRecord {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  status: string;
  start_date: string;
}

// Main dashboard content for employees
function EmployeeHome() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEmployeeRecord();
    }
  }, [user]);

  const fetchEmployeeRecord = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, status, start_date')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('No employee record found. Please contact your administrator.');
        } else {
          setError('Failed to load employee information.');
        }
        return;
      }

      setEmployee(data);
    } catch (err) {
      console.error('Error fetching employee record:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreboardingComplete = () => {
    fetchEmployeeRecord();
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
            <CardTitle className="text-destructive">Access Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show preboarding flow for invited/preboarding employees
  if (employee.status === 'Invited' || employee.status === 'Preboarding') {
    return (
      <div className="p-6">
        <PreboardingFlow
          employeeId={employee.id}
          employeeName={`${employee.first_name} ${employee.last_name}`}
          onComplete={handlePreboardingComplete}
        />
      </div>
    );
  }

  // Show completion status for active employees
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {employee.first_name}!
          </h1>
          <p className="text-muted-foreground">
            Your onboarding is complete. Here's your employee information.
          </p>
        </div>

        {/* Employee Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Employment Status
            </CardTitle>
            <CardDescription>Your current employment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{employee.employee_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {new Date(employee.start_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  employee.status === 'Active' ? 'bg-success' : 'bg-warning'
                }`} />
                <span className="text-sm font-medium">Status: {employee.status}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              Your onboarding process is complete. If you need access to additional features 
              or have questions, please contact your manager or HR representative.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

// Preboarding route component for specific employee ID
function EmployeePreboarding() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeRecord();
    }
  }, [employeeId]);

  const fetchEmployeeRecord = async () => {
    try {
      // Fetch the specific employee record
      const { data, error } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, status, start_date, user_id')
        .eq('id', employeeId)
        .single();

      if (error) {
        setError('Employee not found or access denied.');
        return;
      }

      // Security check: ensure employee can only access their own preboarding
      if (data.user_id !== user?.id) {
        setError('Access denied. You can only access your own preboarding.');
        return;
      }

      setEmployee(data);
    } catch (err) {
      console.error('Error fetching employee record:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreboardingComplete = () => {
    fetchEmployeeRecord();
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
            <CardTitle className="text-destructive">Access Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PreboardingFlow
        employeeId={employee.id}
        employeeName={`${employee.first_name} ${employee.last_name}`}
        onComplete={handlePreboardingComplete}
      />
    </div>
  );
}

// Main employee dashboard with routing and sidebar
export function EmployeeDashboard() {
  return (
    <EmailVerificationGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <EmployeeSidebar />
          
          <div className="flex-1 flex flex-col">
            <EmployeeHeader />
            
            <main className="flex-1 overflow-auto bg-gradient-to-br from-background to-muted/20">
              <Routes>
                <Route index element={<EmployeeHome />} />
                <Route path="profile" element={<EmployeeProfile />} />
                <Route path="onboarding" element={<EmployeeOnboarding />} />
                <Route path="preboarding/:employeeId" element={<EmployeePreboarding />} />
                {/* Redirect any other paths back to employee home */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </EmailVerificationGuard>
  );
}
