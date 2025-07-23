
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Settings from '../pages/Settings';
import People from '../pages/People';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import { SetupProgress } from './SetupProgress';
import { KPICards } from './KPICards';
import { QuickActions } from './QuickActions';
import { Birthdays } from './Birthdays';
import { WorkAnniversaries } from './WorkAnniversaries';
import { PublicHolidays } from './PublicHolidays';
import { AddEmployeeTwoStepForm } from './AddEmployeeTwoStepForm';
import { AddressStep, MSAStep, SetupComplete } from './SetupFlow';
import { DashboardHeader } from './DashboardHeader';
import { EmailVerificationGuard } from './EmailVerificationGuard';
import { supabase } from '@/integrations/supabase/client';

function DashboardHome() {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showSetupProgress, setShowSetupProgress] = useState(true);

  useEffect(() => {
    checkOnboardingProgress();
  }, []);

  // Also refresh when returning to this route
  useEffect(() => {
    const handleFocus = () => {
      checkOnboardingProgress();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const checkOnboardingProgress = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('basic_info_completed, address_completed, msa_completed, organization_id')
        .eq('user_id', user.user.id)
        .single();

      if (profile) {
        const steps = [];
        
        // Check basic info completion
        if (profile.basic_info_completed) {
          steps.push('basic-info');
        }
        
        // Check address completion
        if (profile.address_completed) {
          steps.push('address');
        }
        
        // Check MSA completion
        if (profile.msa_completed) {
          steps.push('msa');
        }
        
        // Check if first employee has been added
        if (profile.organization_id) {
          const { data: employees } = await supabase
            .from('employees')
            .select('id')
            .eq('organization_id', profile.organization_id)
            .limit(1);
            
          if (employees && employees.length > 0) {
            steps.push('first-employee');
          }
        }
        
        setCompletedSteps(steps);
        
        // Hide setup progress if all steps are completed
        if (steps.includes('first-employee')) {
          setShowSetupProgress(false);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding progress:', error);
    }
  };

  const handleSetupStepClick = (stepId: string) => {
    const stepUrls: Record<string, string> = {
      'address': '/dashboard/setup/address',
      'msa': '/dashboard/setup/msa',
      'first-employee': '/dashboard/add-employee'
    };
    
    if (stepUrls[stepId]) {
      navigate(stepUrls[stepId]);
    }
  };

  const handleSetupDismiss = () => {
    setShowSetupProgress(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 md:space-y-8 w-full">
      {showSetupProgress && (
        <SetupProgress 
          completedSteps={completedSteps}
          onStepClick={handleSetupStepClick}
          onDismiss={handleSetupDismiss}
        />
      )}

      <KPICards />
      <QuickActions />

      <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Birthdays />
        <WorkAnniversaries />
        <PublicHolidays />
      </div>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground mt-2">This page is coming soon.</p>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <EmailVerificationGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            <DashboardHeader />

            <main className="flex-1 overflow-auto bg-gradient-to-br from-background to-muted/20">
              <Routes>
                <Route index element={<DashboardHome />} />
                <Route path="add-employee" element={<AddEmployeeTwoStepForm />} />
                <Route path="setup/address" element={
                  <AddressStep onComplete={() => {
                    navigate('/dashboard');
                  }} />
                } />
                <Route path="setup/msa" element={
                  <MSAStep onComplete={() => {
                    navigate('/dashboard');
                  }} />
                } />
                <Route path="setup/complete" element={
                  <SetupComplete onContinue={() => {
                    navigate('/dashboard');
                  }} />
                } />
                <Route path="people" element={<People />} />
                <Route path="people/add" element={<AddEmployeeTwoStepForm onSuccess={() => navigate('/dashboard/people')} />} />
                <Route path="teams" element={<PlaceholderPage title="Teams" />} />
                <Route path="time" element={<PlaceholderPage title="Time & Attendance" />} />
                <Route path="reports" element={<PlaceholderPage title="Reports" />} />
                <Route path="billing" element={<PlaceholderPage title="Billing" />} />
                <Route path="invoices" element={<PlaceholderPage title="Invoices" />} />
                <Route path="settings" element={<Settings />} />
                <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </EmailVerificationGuard>
  );
}
