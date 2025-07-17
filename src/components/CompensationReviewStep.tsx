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
import { EmployeeDetailsData } from './EmployeeDetailsStep';
import { format } from "date-fns";

const compensationReviewSchema = z.object({
  salary: z.number().min(1, 'Salary is required'),
  currency: z.string().min(1, 'Currency is required'),
  agreementAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the employment agreement to proceed'
  })
});

export interface CompensationReviewData {
  salary: number;
  currency: string;
  agreementAccepted: boolean;
}

interface CompensationReviewStepProps {
  onNext: (data: CompensationReviewData) => void;
  onBack: () => void;
  employeeData: EmployeeDetailsData;
  isSubmitting: boolean;
  defaultValues?: Partial<CompensationReviewData>;
}

export function CompensationReviewStep({ 
  onNext, 
  onBack, 
  employeeData, 
  isSubmitting, 
  defaultValues 
}: CompensationReviewStepProps) {
  const form = useForm<CompensationReviewData>({
    resolver: zodResolver(compensationReviewSchema),
    defaultValues: {
      salary: defaultValues?.salary || 0,
      currency: defaultValues?.currency || 'USD',
      agreementAccepted: defaultValues?.agreementAccepted || false
    }
  });

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' }
  ];

  const onSubmit = (data: CompensationReviewData) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Compensation & Final Review</h3>
        <p className="text-sm text-muted-foreground">
          Set salary details and review the complete employee information before finalizing.
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
            </div>
          </div>

          {/* Employee Information Review */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Employee Information Review</h4>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Complete Employee Record</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Personal Information */}
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-2">Personal Information</h5>
                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Full Name:</span>
                      <p className="font-medium">{employeeData.firstName} {employeeData.lastName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Email:</span>
                      <p>{employeeData.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Phone:</span>
                      <p>{employeeData.phone}</p>
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
                      <p>{employeeData.jobTitle}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Seniority:</span>
                      <p className="capitalize">{employeeData.seniority.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Start Date:</span>
                      <p>{employeeData.startDate ? format(employeeData.startDate, "PPP") : 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Work Location:</span>
                      <p className="capitalize">{employeeData.workLocation}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Compensation Information */}
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-2">Compensation</h5>
                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Annual Salary:</span>
                      <p className="font-medium text-lg">
                        {form.watch('currency')} {form.watch('salary')?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Job Description Preview */}
                {employeeData.jobDescription && (
                  <>
                    <Separator />
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-2">Job Description</h5>
                      <div className="p-3 bg-muted/30 rounded-md text-sm whitespace-pre-line max-h-32 overflow-y-auto">
                        {employeeData.jobDescription}
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
                      By checking this box, I verify that the employee details above are correct and 
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
              Back: Employee Details
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