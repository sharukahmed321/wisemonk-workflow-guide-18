
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  action?: string;
}

export function EmployeeOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  useEffect(() => {
    if (user) {
      fetchOnboardingStatus();
    }
  }, [user]);

  const fetchOnboardingStatus = async () => {
    try {
      const { data: employeeData, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching employee:', error);
        return;
      }

      setEmployee(employeeData);
      
      // Create onboarding steps based on available employee data
      const hasPersonalDetails = Boolean(
        employeeData.first_name && 
        employeeData.last_name && 
        employeeData.email
      );
      
      const hasJobDetails = Boolean(
        employeeData.job_title && 
        employeeData.department && 
        employeeData.employment_type
      );
      
      const hasAddressDetails = Boolean(
        employeeData.address_line_1 && 
        employeeData.city && 
        employeeData.state
      );

      const onboardingSteps: OnboardingStep[] = [
        {
          id: 'personal-details',
          title: 'Personal Details',
          description: 'Complete your personal information and contact details',
          status: hasPersonalDetails ? 'completed' : 'in-progress',
        },
        {
          id: 'job-details',
          title: 'Job Information',
          description: 'Review your job title, department, and employment details',
          status: hasJobDetails ? 'completed' : hasPersonalDetails ? 'in-progress' : 'pending',
        },
        {
          id: 'address-details',
          title: 'Address Information',
          description: 'Complete your address and contact information',
          status: hasAddressDetails ? 'completed' : hasJobDetails ? 'in-progress' : 'pending',
        },
        {
          id: 'welcome',
          title: 'Welcome to the Team',
          description: 'Complete your onboarding and join the team',
          status: employeeData.status === 'Active' ? 'completed' : 'pending',
        }
      ];

      setSteps(onboardingSteps);
    } catch (err) {
      console.error('Error fetching onboarding status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: OnboardingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-warning" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: OnboardingStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'in-progress':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleContinueOnboarding = () => {
    if (employee && (employee.status === 'Invited' || employee.status === 'Preboarding')) {
      navigate(`/dashboard/preboarding/${employee.employee_id}`);
    }
  };

  const calculateProgress = () => {
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const getDueDate = () => {
    if (employee && employee.start_date) {
      const startDate = new Date(employee.start_date);
      const dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() - 7); // Due 7 days before start date
      return dueDate;
    }
    return null;
  };

  const isOverdue = () => {
    const dueDate = getDueDate();
    return dueDate && new Date() > dueDate;
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Welcome to WiseMonk</h1>
        <p className="text-lg text-muted-foreground">Let's get you ready for your first day</p>
      </div>

      {/* Main Preboarding Card */}
      {employee && (employee.status === 'Invited' || employee.status === 'Preboarding') && (
        <Card className="mx-auto max-w-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Complete Your Preboarding</h2>
                <p className="text-muted-foreground">Finish setting up your profile and documents</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-background/80 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Progress</span>
                    <span className="font-bold text-primary">{calculateProgress()}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all duration-500 ease-in-out" 
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span>Progress saved</span>
                  </div>
                </div>

                {getDueDate() && (
                  <div className={`text-sm ${isOverdue() ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {isOverdue() ? 'Overdue' : 'Due'}: {getDueDate()?.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleContinueOnboarding}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={step.id} className={`${
            step.status === 'completed' ? 'bg-success/5 border-success/20' :
            step.status === 'in-progress' ? 'bg-warning/5 border-warning/20' :
            'bg-muted/30'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      Step {index + 1}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(step.status)}`}>
                      {step.status === 'completed' ? 'Completed' :
                       step.status === 'in-progress' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>Your onboarding completion status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{steps.filter(s => s.status === 'completed').length} of {steps.length} completed</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
