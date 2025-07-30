
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CountrySelect } from './ui/country-select';
import { 
  createNameValidator, 
  createJobTitleValidator, 
  createBusinessNameValidator,
  createDropdownValidator,
  EMPLOYEE_COUNTS,
  COUNTRIES
} from '@/lib/validationUtils';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const userDetailsSchema = z.object({
  firstName: createNameValidator('First name', 2, 50),
  lastName: createNameValidator('Last name', 1, 50),
  designation: createJobTitleValidator(100),
});

const companyDetailsSchema = z.object({
  companyName: createBusinessNameValidator('Company name', 100),
  legalName: createBusinessNameValidator('Legal name', 100),
  country: createDropdownValidator('a country', COUNTRIES),
  employeeCount: createDropdownValidator('employee count', EMPLOYEE_COUNTS),
});

type UserDetailsFormData = z.infer<typeof userDetailsSchema>;
type CompanyDetailsFormData = z.infer<typeof companyDetailsSchema>;

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState<UserDetailsFormData>({
    firstName: '',
    lastName: '',
    designation: ''
  });
  const [companyData, setCompanyData] = useState<CompanyDetailsFormData>({
    companyName: '',
    legalName: '',
    country: '',
    employeeCount: ''
  });
  const { toast } = useToast();

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        {currentStep === 1 && (
          <UserDetailsStep 
            onNext={handleNext}
            userData={userData}
            setUserData={setUserData}
          />
        )}
        {currentStep === 2 && (
          <CompanyDetailsStep 
            onNext={handleNext}
            onBack={handleBack}
            companyData={companyData}
            setCompanyData={setCompanyData}
          />
        )}
        {currentStep === 3 && (
          <SetupCompleteStep onComplete={onComplete} />
        )}
      </div>
    </div>
  );
}

interface UserDetailsStepProps {
  onNext: () => void;
  userData: UserDetailsFormData;
  setUserData: (data: UserDetailsFormData) => void;
}

function UserDetailsStep({ onNext, userData, setUserData }: UserDetailsStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<UserDetailsFormData>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: userData,
  });

  const onSubmit = async (data: UserDetailsFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          job_title: data.designation,
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        throw error;
      }

      setUserData(data);
      toast({
        title: "Success",
        description: "Personal information saved successfully.",
      });
      onNext();
    } catch (error) {
      console.error('Error saving user details:', error);
      toast({
        title: "Error",
        description: "Failed to save personal information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Welcome! Let's get started</h2>
        <p className="text-muted-foreground">Tell us a bit about yourself</p>
      </div>

      <div className="space-y-3">
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full w-1/3"></div>
        </div>
        <p className="text-sm text-muted-foreground text-center">Step 1 of 3</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your first name" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your last name" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="designation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., HR Manager, CEO, etc." className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full h-11 mt-6"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </Form>
    </div>
  );
}

interface CompanyDetailsStepProps {
  onNext: () => void;
  onBack: () => void;
  companyData: CompanyDetailsFormData;
  setCompanyData: (data: CompanyDetailsFormData) => void;
}

function CompanyDetailsStep({ onNext, onBack, companyData, setCompanyData }: CompanyDetailsStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<CompanyDetailsFormData>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: companyData,
  });

  const onSubmit = async (data: CompanyDetailsFormData) => {
    setIsSubmitting(true);
    
    try {
      // Create or update organization using the new upsert function
      const { data: organizationId, error: orgError } = await supabase.rpc('upsert_organization', {
        p_name: data.companyName,
        p_legal_name: data.legalName,
        p_country: data.country,
        p_employee_count: data.employeeCount as any,
      });

      if (orgError) {
        throw orgError;
      }

      setCompanyData(data);
      toast({
        title: "Success",
        description: "Company information saved successfully.",
      });
      onNext();
    } catch (error) {
      console.error('Error saving company details:', error);
      toast({
        title: "Error",
        description: "Failed to save company information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Using COUNTRIES and EMPLOYEE_COUNTS from validationUtils

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Company Information</h2>
        <p className="text-muted-foreground">Help us understand your organization</p>
      </div>

      <div className="space-y-3">
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full w-2/3"></div>
        </div>
        <p className="text-sm text-muted-foreground text-center">Step 2 of 3</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter company name" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="legalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legal Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter legal company name" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country *</FormLabel>
                <FormControl>
                  <CountrySelect
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select your country"
                    className="h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employeeCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Employees *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select employee count" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EMPLOYEE_COUNTS.map((count) => (
                      <SelectItem key={count} value={count}>
                        {count} employees
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-11">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 h-11"
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

interface SetupCompleteStepProps {
  onComplete: () => void;
}

function SetupCompleteStep({ onComplete }: SetupCompleteStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Great! You're almost ready</h2>
        <p className="text-muted-foreground">
          Your basic setup is complete. Complete the remaining steps to unlock all features.
        </p>
      </div>

      <div className="space-y-3">
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full w-full"></div>
        </div>
        <p className="text-sm text-muted-foreground text-center">Step 3 of 3</p>
      </div>

      <Button onClick={onComplete} className="w-full h-11">
        Go to Dashboard
      </Button>
    </div>
  );
}
