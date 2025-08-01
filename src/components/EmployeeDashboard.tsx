import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EmailVerificationGuard } from './EmailVerificationGuard';
import { DashboardHeader } from './DashboardHeader';
import { PreboardingFlow } from './PreboardingFlow';
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

export function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    // Refresh employee data to get updated status
    fetchEmployeeRecord();
  };

  if (loading) {
    return (
      <EmailVerificationGuard>
        <div className="min-h-screen flex w-full">
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your dashboard...</p>
              </div>
            </main>
          </div>
        </div>
      </EmailVerificationGuard>
    );
  }

  if (error || !employee) {
    return (
      <EmailVerificationGuard>
        <div className="min-h-screen flex w-full">
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
              <Card className="max-w-md">
                <CardHeader className="text-center">
                  <CardTitle className="text-destructive">Access Error</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
              </Card>
            </main>
          </div>
        </div>
      </EmailVerificationGuard>
    );
  }

  // Show preboarding flow for invited/preboarding employees
  if (employee.status === 'Invited' || employee.status === 'Preboarding') {
    return (
      <EmailVerificationGuard>
        <div className="min-h-screen flex w-full">
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="flex-1 overflow-auto bg-gradient-to-br from-background to-muted/20">
              <div className="p-6">
                <PreboardingFlow
                  employeeId={employee.id}
                  employeeName={`${employee.first_name} ${employee.last_name}`}
                  onComplete={handlePreboardingComplete}
                />
              </div>
            </main>
          </div>
        </div>
      </EmailVerificationGuard>
    );
  }

  // Show completion status for active employees
  return (
    <EmailVerificationGuard>
      <div className="min-h-screen flex w-full">
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-auto bg-gradient-to-br from-background to-muted/20">
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
          </main>
        </div>
      </div>
    </EmailVerificationGuard>
  );
}