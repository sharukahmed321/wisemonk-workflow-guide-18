
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EmailVerificationGuard } from './EmailVerificationGuard';
import { EmployeeHeader } from './EmployeeHeader';
import { PreboardingFlow } from './PreboardingFlow';
import { EmployeeSidebar } from './EmployeeSidebar';
import EmployeeProfileCard from './EmployeeProfileCard';
import { EmployeeOnboarding } from './EmployeeOnboarding';
import { EmployeeOnboardingFlow } from './EmployeeOnboardingFlow';
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Calendar, AlertCircle } from 'lucide-react';
import { usePreboardingStatus } from '@/hooks/usePreboardingStatus';
import { PreboardingAlert } from './PreboardingAlert';
import { EmployeeQuickActions } from './EmployeeQuickActions';
import { EmployeeStatusCards } from './EmployeeStatusCards';
import { Birthdays } from './Birthdays';
import { WorkAnniversaries } from './WorkAnniversaries';
import { PublicHolidays } from './PublicHolidays';

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
  const { needsPreboarding, progress, employee, shouldHideOrgContent, dueDate, loading, error } = usePreboardingStatus();
  
  useEffect(() => {
    document.title = "My Dashboard | Wisemonk";
    return () => {
      document.title = "Wisemonk";
    };
  }, []);

  const handlePreboardingComplete = () => {
    // Refresh data after preboarding completion
    window.location.reload();
  };

  const handleOnboardingComplete = () => {
    // Mock completion - in real app would update employee status to "Active"
    console.log('Employee onboarding completed!');
    // Refresh data after onboarding completion
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 md:space-y-8 w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Show preboarding flow for invited/preboarding employees
  if (needsPreboarding && employee) {
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

  // Show onboarding flow for employees with "Onboarding" status
  if (employee && employee.status === 'Onboarding') {
    return (
      <EmployeeOnboardingFlow
        employeeId={employee.id}
        employeeName={`${employee.first_name} ${employee.last_name}`}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Show welcome message for users without employee records or those not in preboarding
  const displayName = employee ? `${employee.first_name}` : user?.user_metadata?.first_name || 'there';

  return (
    <div className="p-6 md:p-8 space-y-6 md:space-y-8 w-full">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {displayName}!</h1>
        <p className="text-muted-foreground">Here's your personal dashboard overview.</p>
      </div>

      {/* Show preboarding alert if user needs preboarding */}
      {needsPreboarding && employee && (
        <PreboardingAlert employee={employee} progress={progress} dueDate={dueDate} />
      )}

      {/* Show notice for users without employee records */}
      {!employee && !loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-blue-900">Getting Started</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-blue-700">
              Your employee profile is being set up. Once your administrator completes your employee record, 
              you'll see more personalized content here. If you have any questions, please contact your administrator.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Grid - Show celebrations and quick actions for all users */}
      <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-2">
        {/* Left Column - Celebrations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Celebrations</h2>
          </div>
          
          <div className="space-y-4">
            <Birthdays />
            <WorkAnniversaries />
            <PublicHolidays />
          </div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <EmployeeQuickActions />
          <EmployeeStatusCards />
        </div>
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
      // Fetch the specific employee record by employee_id
      const { data, error } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, status, start_date, user_id')
        .eq('employee_id', employeeId)
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
                <Route path="profile" element={<EmployeeProfileCard />} />
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
