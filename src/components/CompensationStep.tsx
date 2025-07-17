import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PersonalInfoData } from './PersonalInfoStep';
import { JobWorkData } from './JobWorkStep';
import { format } from "date-fns";

const compensationSchema = z.object({
  salary: z.number().min(1, 'Salary is required'),
  currency: z.string().min(1, 'Currency is required'),
  department: z.string().min(1, 'Department is required'),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'intern']),
  agreementAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the employment agreement to proceed'
  })
});

export interface CompensationData {
  salary: number;
  currency: string;
  department: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
  agreementAccepted: boolean;
}

interface CompensationStepProps {
  onNext: (data: CompensationData) => void;
  onBack: () => void;
  personalData: PersonalInfoData;
  jobWorkData: JobWorkData;
  isSubmitting: boolean;
  defaultValues?: Partial<CompensationData>;
}

export function CompensationStep({ 
  onNext, 
  onBack, 
  personalData, 
  jobWorkData, 
  isSubmitting, 
  defaultValues 
}: CompensationStepProps) {
  const form = useForm<CompensationData>({
    resolver: zodResolver(compensationSchema),
    defaultValues: {
      salary: defaultValues?.salary || 0,
      currency: defaultValues?.currency || 'USD',
      department: defaultValues?.department || '',
      employmentType: defaultValues?.employmentType || 'full-time',
      agreementAccepted: defaultValues?.agreementAccepted || false
    }
  });

  const departments = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'sales', label: 'Sales' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' },
    { value: 'design', label: 'Design' },
    { value: 'product', label: 'Product' },
    { value: 'customer-success', label: 'Customer Success' }
  ];

  const employmentTypes = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' }
  ];

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' }
  ];

  const onSubmit = (data: CompensationData) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Compensation & Employment Agreement</h3>
        <p className="text-sm text-muted-foreground">
          Set salary details and review the complete employment agreement before finalizing.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Compensation Details */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Compensation Details</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Salary *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        className="h-11"
                        onChange={e => field.onChange(Number(e.target.value))}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employmentTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Employment Agreement Preview */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Employment Agreement Review</h4>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Complete Employment Agreement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Personal Information */}
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-2">Personal Information</h5>
                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Full Name:</span>
                      <p className="font-medium">{personalData.firstName} {personalData.lastName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Email:</span>
                      <p>{personalData.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Phone:</span>
                      <p>{personalData.phone}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Job Information */}
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-2">Position Details</h5>
                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Job Title:</span>
                      <p>{jobWorkData.jobTitle}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Seniority:</span>
                      <p className="capitalize">{jobWorkData.seniority.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Start Date:</span>
                      <p>{jobWorkData.startDate ? format(jobWorkData.startDate, "PPP") : 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Work Location:</span>
                      <p className="capitalize">{jobWorkData.workLocation}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Compensation Information */}
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-2">Compensation & Employment</h5>
                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Annual Salary:</span>
                      <p className="font-medium text-lg">
                        {form.watch('currency')} {form.watch('salary')?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Employment Type:</span>
                      <p className="capitalize">{form.watch('employmentType')?.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Department:</span>
                      <p className="capitalize">{departments.find(d => d.value === form.watch('department'))?.label || form.watch('department')}</p>
                    </div>
                  </div>
                </div>

                {/* Job Description Preview */}
                {jobWorkData.jobDescription && (
                  <>
                    <Separator />
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-2">Job Description</h5>
                      <div className="p-3 bg-muted/30 rounded-md text-sm whitespace-pre-line max-h-32 overflow-y-auto">
                        {jobWorkData.jobDescription}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Agreement Acceptance */}
          <div>
            <FormField
              control={form.control}
              name="agreementAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">
                      I confirm that all information provided is accurate and complete *
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      By checking this box, I verify that the employment details above are correct and 
                      authorize the creation of this employee record in the system.
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Back: Job & Work Details
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Adding Employee...' : 'Complete & Add Employee'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}