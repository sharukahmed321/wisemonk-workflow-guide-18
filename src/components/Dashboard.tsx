import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Settings from '../pages/Settings';
import People from '../pages/People';
import { AddEmployeeTwoStepForm } from './AddEmployeeTwoStepForm';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { CheckCircle, Clock, Users, Building, FileText, Plus } from 'lucide-react';
import { Progress } from './ui/progress';

function DashboardHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showSetupProgress, setShowSetupProgress] = useState(true);

  useEffect(() => {
    checkOnboardingProgress();
  }, []);

  // Also refresh when returning to this route or when location changes
  useEffect(() => {
    const handleFocus = () => {
      checkOnboardingProgress();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Refresh progress when user navigates back to dashboard
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      checkOnboardingProgress();
    }
  }, [location.pathname]);

  const checkOnboardingProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: progress } = await supabase.rpc('get_onboarding_progress', {
        user_id_param: user.id
      });

      if (progress && typeof progress === 'object') {
        const completed = [];
        
        if ((progress as any).basic_info?.completed) completed.push('basic_info');
        if ((progress as any).company_info?.completed) completed.push('company_info');
        if ((progress as any).address_info?.completed) completed.push('address_info');
        if ((progress as any).msa_info?.completed) completed.push('msa_info');
        
        setCompletedSteps(completed);
        
        // Only show setup progress if not everything is completed
        setShowSetupProgress(completed.length < 4);
      }
    } catch (error) {
      console.error('Error checking onboarding progress:', error);
    }
  };

  const setupSteps = [
    {
      id: 'basic_info',
      title: 'Complete Profile',
      description: 'Add your personal information',
      icon: Users,
      completed: completedSteps.includes('basic_info')
    },
    {
      id: 'company_info',
      title: 'Company Information',
      description: 'Set up your organization details',
      icon: Building,
      completed: completedSteps.includes('company_info')
    },
    {
      id: 'address_info',
      title: 'Business Address',
      description: 'Add your business location',
      icon: Building,
      completed: completedSteps.includes('address_info')
    },
    {
      id: 'msa_info',
      title: 'Sign Agreement',
      description: 'Complete the MSA signing process',
      icon: FileText,
      completed: completedSteps.includes('msa_info')
    }
  ];

  const progressPercentage = (completedSteps.length / setupSteps.length) * 100;
  const nextStep = setupSteps.find(step => !step.completed);

  const handleContinueSetup = () => {
    if (nextStep) {
      navigate('/dashboard/setup');
    }
  };

  const handleAddEmployee = () => {
    navigate('/dashboard/people/add');
  };

  const handleViewPeople = () => {
    navigate('/dashboard/people');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your team.</p>
        </div>
      </div>

      {/* Setup Progress Card */}
      {showSetupProgress && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Setup Progress
              </CardTitle>
              <Badge variant="outline">
                {completedSteps.length} of {setupSteps.length} completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {setupSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${step.completed ? 'bg-success/10' : 'bg-muted'}`}>
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <step.icon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                  {step.completed && (
                    <Badge variant="secondary" className="text-xs">
                      Complete
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {nextStep && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">Next: {nextStep.title}</div>
                  <div className="text-sm text-muted-foreground">{nextStep.description}</div>
                </div>
                <Button onClick={handleContinueSetup}>
                  Continue Setup
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleAddEmployee}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Add Employee</h3>
                <p className="text-sm text-muted-foreground">Add a new team member</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewPeople}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-full">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold">View People</h3>
                <p className="text-sm text-muted-foreground">Manage your team</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-full">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Documents</h3>
                <p className="text-sm text-muted-foreground">Access all documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-full">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Setup completed</div>
                <div className="text-xs text-muted-foreground">Your account setup is now complete</div>
              </div>
              <div className="text-xs text-muted-foreground">2 hours ago</div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Ready to add employees</div>
                <div className="text-xs text-muted-foreground">Start building your team</div>
              </div>
              <div className="text-xs text-muted-foreground">Just now</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4">
              <SidebarTrigger className="mr-4" />
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold">Dashboard</h2>
              </div>
            </div>
          </header>
          <div className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/people" element={<People />} />
              <Route path="/people/add" element={<AddEmployeeTwoStepForm />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
