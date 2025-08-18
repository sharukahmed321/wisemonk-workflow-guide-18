import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Save, AlertTriangle, TestTube } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { StepOverview } from './StepOverview';
import { EmployeeDetailsStep, EmployeeDetailsData } from './EmployeeDetailsStep';
import { CompensationReviewStep, CompensationReviewData } from './CompensationReviewStep';
import { WizardStepIndicator } from './WizardStepIndicator';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

export interface CompleteEmployeeData extends EmployeeDetailsData, CompensationReviewData {}

interface AddEmployeeTwoStepFormProps {
  onSuccess?: () => void;
}

const DRAFT_STORAGE_KEY = 'employee-form-draft';

export function AddEmployeeTwoStepForm({ onSuccess }: AddEmployeeTwoStepFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0); // 0 = overview, 1-2 = form steps
  const [employeeData, setEmployeeData] = useState<EmployeeDetailsData | null>(null);
  const [compensationData, setCompensationData] = useState<CompensationReviewData | null>(null);
  const [currentFormData, setCurrentFormData] = useState<CompensationReviewData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResults, setConnectionTestResults] = useState<string | null>(null);

  // Load draft data on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.employeeData) {
          // Parse date if it exists
          const employee = { ...draft.employeeData };
          if (employee.startDate) {
            employee.startDate = new Date(employee.startDate);
          }
          setEmployeeData(employee);
        }
        if (draft.compensationData) setCompensationData(draft.compensationData);
        if (draft.currentStep) setCurrentStep(draft.currentStep);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  // Auto-save draft data
  const saveDraft = (step: number, data: any) => {
    const draftData = {
      currentStep: step,
      employeeData: step >= 1 ? data : employeeData,
      compensationData: step >= 2 ? data : compensationData
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const handleStartForm = () => {
    setCurrentStep(1);
  };

  const handleEmployeeDetailsComplete = (data: EmployeeDetailsData) => {
    setEmployeeData(data);
    saveDraft(1, data);
    setCurrentStep(2);
    toast({
      title: "Progress Saved",
      description: "Employee details saved. Final step: compensation and review.",
    });
  };

  // Manual database connection test for debugging
  const runManualConnectionTest = async () => {
    setIsTestingConnection(true);
    setConnectionTestResults(null);
    
    try {
      const results = await testDatabaseConnection();
      setConnectionTestResults('✅ All database tests passed! Form should work properly.');
      toast({
        title: "Database Test Passed",
        description: "All permissions and connectivity checks passed.",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setConnectionTestResults(`❌ Database test failed: ${errorMsg}`);
      toast({
        title: "Database Test Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Test database connectivity and permissions
  const testDatabaseConnection = async () => {
    console.log('🔧 Testing database connectivity and permissions...');
    
    try {
      // Test basic auth
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        throw new Error('User not authenticated');
      }
      console.log('✅ Auth test passed:', { userId: user.id, email: user.email });
      
      // Test user_roles read permission
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, organization_id')
        .eq('user_id', user.id);
      
      if (rolesError) {
        console.error('❌ user_roles read test failed:', rolesError);
        throw new Error(`Cannot read user roles: ${rolesError.message}`);
      }
      console.log('✅ user_roles read test passed:', roles);
      
      // Test profiles read permission
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('❌ profiles read test failed:', profileError);
        throw new Error(`Cannot read profiles: ${profileError.message}`);
      }
      console.log('✅ profiles read test passed:', profile);
      
      return { user, roles, profile };
    } catch (error) {
      console.error('❌ Database connectivity test failed:', error);
      throw error;
    }
  };

  const handleCompensationComplete = async (data: CompensationReviewData) => {
    console.log('🚀 Form submission started with data:', {
      employee: employeeData,
      compensation: data,
      timestamp: new Date().toISOString()
    });

    setCompensationData(data);
    setIsSubmitting(true);

    try {
      // Step 0: Test database connectivity and permissions
      const { user, roles } = await testDatabaseConnection();
      
      if (!employeeData) {
        console.error('❌ Employee details are missing');
        throw new Error('Employee details are missing');
      }

      if (!roles || roles.length === 0) {
        console.error('❌ No user roles found');
        throw new Error('No user roles found. Please contact administrator.');
      }

      // Get organization ID from user roles
      const userRole = roles[0]; // Take the first role
      if (!userRole?.organization_id) {
        console.error('❌ Organization not found in user roles');
        throw new Error('Organization not found. Please complete setup first.');
      }

      const organizationId = userRole.organization_id;

      console.log('🚀 Starting employee creation process with data:', {
        email: employeeData.email,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        jobTitle: employeeData.jobTitle,
        department: data.department,
        employmentType: data.employmentType,
        organizationId,
        userId: user.id
      });

      // Check for existing employee with same email
      const { data: existingEmployee } = await supabase
        .from('employees')
        .select('email')
        .eq('email', employeeData.email)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existingEmployee) {
        console.error('❌ Employee with this email already exists');
        throw new Error(`Employee with email ${employeeData.email} already exists.`);
      }

      // Generate employee ID
      const randomNum = Math.floor(Math.random() * 999) + 1;
      const employeeId = `EMP${randomNum.toString().padStart(3, '0')}`;
      console.log('📋 Generated employee ID:', employeeId);

      // Transaction-like approach with rollback capability
      let profileData = null;
      let employeeRecord = null;
      let roleData = null;

      try {
        // Step 1: Create pre-registered profile for the employee
        console.log('📝 Step 1: Creating pre-registered profile...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: null, // Set to null for pre-registered employees
            email: employeeData.email,
            first_name: employeeData.firstName,
            last_name: employeeData.lastName,
            job_title: employeeData.jobTitle,
            department: data.department,
            organization_id: organizationId,
            is_pre_registered: true,
            invited_by: user.id,
            invited_at: new Date().toISOString(),
            basic_info_completed: false,
            company_info_completed: false,
            address_completed: false,
            msa_completed: false,
            setup_completed: false,
            basic_info_status: 'pending',
            company_info_status: 'pending',
            address_status: 'pending',
            msa_status: 'pending'
          })
          .select()
          .single();

        if (profileError) {
          console.error('❌ Profile creation failed:', profileError);
          throw new Error(`Failed to create employee profile: ${profileError.message}`);
        }

        profileData = profile;
        console.log('✅ Profile created successfully:', { id: profileData.id, email: profileData.email });

        // Step 2: Create employee record
        console.log('👤 Step 2: Creating employee record...');
        
        // Map gender to the database format (Male -> Son, Female -> Daughter)
        const genderMapping = {
          'Male': 'Son',
          'Female': 'Daughter'
        };
        const mappedGender = employeeData.gender ? genderMapping[employeeData.gender as keyof typeof genderMapping] : undefined;
        
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .insert({
            employee_id: employeeId,
            first_name: employeeData.firstName,
            last_name: employeeData.lastName,
            email: employeeData.email,
            phone: employeeData.phone,
            gender: mappedGender,
            job_title: employeeData.jobTitle,
            seniority: employeeData.seniority,
            work_location: employeeData.workLocation,
            job_description: employeeData.jobDescription,
            department: data.department, // Using actual form data
            employment_type: data.employmentType, // Using actual form data
            annual_gross_salary: data.salary, // Map to annual_gross_salary to trigger calculations
            salary: data.salary, // Keep for backward compatibility
            currency: data.currency,
            start_date: employeeData.startDate ? employeeData.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            last_date: employeeData.lastDate ? 
              employeeData.lastDate.toISOString().split('T')[0] : 
              new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default: today + 5 days
            status: 'Invited',
            organization_id: organizationId,
            user_id: null, // No user_id until they sign up
            added_by_user_id: user.id, // Track who added the employee
            added_by_email: user.email // Track the email of who added the employee
          })
          .select()
          .single();

        if (employeeError) {
          console.error('❌ Employee creation failed:', employeeError);
          throw new Error(`Failed to create employee record: ${employeeError.message}`);
        }

        employeeRecord = employee;
        console.log('✅ Employee record created successfully:', { 
          id: employeeRecord.id, 
          employeeId: employeeRecord.employee_id,
          email: employeeRecord.email 
        });

        // Step 3: Create user role for the pre-registered employee
        console.log('🔐 Step 3: Creating user role...');
        
        // First check if a pending employee role already exists for this organization
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('role', 'employee')
          .is('user_id', null)
          .maybeSingle();

        if (existingRole) {
          // Reuse the existing pending role
          roleData = existingRole;
          console.log('✅ Reusing existing pending employee role:', { 
            id: roleData.id, 
            role: roleData.role,
            organizationId: roleData.organization_id 
          });
        } else {
          // Create a new pending employee role
          const { data: role, error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: null, // Now nullable! Will be updated when employee signs up
              role: 'employee',
              organization_id: organizationId,
              assigned_by: user.id
            })
            .select()
            .single();

          if (roleError) {
            console.error('❌ User role creation failed:', roleError);
            throw new Error(`Failed to create user role: ${roleError.message}`);
          }

          roleData = role;
          console.log('✅ User role created successfully:', { 
            id: roleData.id, 
            role: roleData.role,
            organizationId: roleData.organization_id 
          });
        }

        console.log('🎉 All operations completed successfully!');

        // Send employment email to the new employee
        try {
          console.log('📧 Sending employment email...');
          
          // Get organization name for the email
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', organizationId)
            .single();

          const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-employment-email', {
            body: {
              employeeFirstName: employeeData.firstName,
              employeeEmail: employeeData.email,
              organizationName: orgData?.name || 'Your Organization'
            }
          });

          if (emailError) {
            console.error('❌ Failed to send employment email:', emailError);
            // Don't fail the entire process for email issues, just log it
            toast({
              title: "Employee Added",
              description: `${employeeData.firstName} ${employeeData.lastName} has been added, but the welcome email failed to send.`,
              variant: "destructive",
            });
          } else {
            console.log('✅ Employment email sent successfully:', emailResponse);
            toast({
              title: "Success!",
              description: `${employeeData.firstName} ${employeeData.lastName} has been added to your team and sent a welcome email.`,
            });
          }
        } catch (emailError) {
          console.error('❌ Error sending employment email:', emailError);
          // Show success for employee creation even if email fails
          toast({
            title: "Employee Added",
            description: `${employeeData.firstName} ${employeeData.lastName} has been added, but the welcome email failed to send.`,
            variant: "destructive",
          });
        }

        setShowSuccess(true);
        clearDraft();

        // Auto-redirect after success with reduced delay
        setTimeout(() => {
          try {
            if (onSuccess) {
              onSuccess();
            } else {
              navigate('/dashboard/people?tab=Invited');
            }
          } catch (navError) {
            console.error('❌ Navigation error:', navError);
            // Fallback to basic dashboard navigation
            navigate('/dashboard');
          }
        }, 500); // Reduced from 1500ms to 500ms

      } catch (operationError) {
        console.error('❌ Transaction failed, attempting cleanup...', operationError);
        
        // Attempt cleanup of created records in reverse order
        if (roleData?.id) {
          console.log('🧹 Cleaning up user role...');
          await supabase.from('user_roles').delete().eq('id', roleData.id);
        }
        
        if (employeeRecord?.id) {
          console.log('🧹 Cleaning up employee record...');
          await supabase.from('employees').delete().eq('id', employeeRecord.id);
        }
        
        if (profileData?.id) {
          console.log('🧹 Cleaning up profile...');
          await supabase.from('profiles').delete().eq('id', profileData.id);
        }

        throw operationError; // Re-throw to be caught by outer catch
      }

    } catch (error) {
      console.error('❌ Unexpected error during employee creation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create employee. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleSaveAndExit = () => {
    // Save all available form data based on current step
    const draftData = {
      currentStep,
      employeeData: employeeData,
      compensationData: currentStep === 2 && currentFormData ? currentFormData : compensationData
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    
    toast({
      title: "Draft Saved",
      description: "Your progress has been saved. You can continue later from where you left off.",
    });
    navigate('/dashboard');
  };

  const handleFormDataChange = (data: CompensationReviewData) => {
    setCurrentFormData(data);
  };

  const stepTitles = [
    'Getting Started',
    'Employee Details',
    'Compensation & Review'
  ];

  const wizardSteps = [
    {
      number: 1,
      title: 'Employee Details',
      isCompleted: currentStep > 1,
      isCurrent: currentStep === 1
    },
    {
      number: 2,
      title: 'Compensation & Review',
      isCompleted: currentStep > 2,
      isCurrent: currentStep === 2
    }
  ];

  if (showSuccess && employeeData) {
    return (
      <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Employee Added Successfully!</h3>
                <p className="text-muted-foreground mt-1">
                  {employeeData.firstName} {employeeData.lastName} has been added to your team.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Redirecting to People page...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <StepOverview onStart={handleStartForm} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <span>/</span>
            <span>Add Employee</span>
            <span>/</span>
            <span className="text-foreground font-medium">Step {currentStep} of 2</span>
          </div>
          
          {currentStep > 0 && (
            <Button 
              variant="outline"
              size="sm"
              onClick={handleSaveAndExit}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Draft & Exit
            </Button>
          )}
        </div>

        {/* Wizard Step Indicator */}
        {currentStep > 0 && (
          <div className="py-6">
            <WizardStepIndicator steps={wizardSteps} />
          </div>
        )}

        {/* Main Content Card */}
        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold text-foreground">
              {stepTitles[currentStep]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <EmployeeDetailsStep 
                onNext={handleEmployeeDetailsComplete}
                defaultValues={employeeData || undefined}
              />
            )}
            {currentStep === 2 && employeeData && (
              <>
                <CompensationReviewStep 
                  onNext={handleCompensationComplete}
                  onBack={() => handleBackToStep(1)}
                  employeeData={employeeData}
                  isSubmitting={isSubmitting}
                  defaultValues={compensationData || undefined}
                  onFormChange={handleFormDataChange}
                />
                
                </>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
