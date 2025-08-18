import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { EmployeeDetailsData } from './EmployeeDetailsStep';
import { createSalaryValidator } from '@/lib/validationUtils';
import { sanitizeNumericInput, formatNumberWithCommas, convertNumberToWords } from '@/lib/salaryUtils';
import { format } from "date-fns";

const compensationReviewSchema = z.object({
  salary: createSalaryValidator(),
  currency: z.string().min(1, 'This field is required'),
  department: z.string().min(1, 'This field is required'),
  employmentType: z.string().min(1, 'This field is required'),
  agreementAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the employment agreement to proceed'
  })
});

export interface CompensationReviewData {
  salary: number;
  currency: string;
  department: string;
  employmentType: string;
  agreementAccepted: boolean;
}

interface CompensationReviewStepProps {
  onNext: (data: CompensationReviewData) => void;
  onBack: () => void;
  employeeData: EmployeeDetailsData;
  isSubmitting: boolean;
  defaultValues?: Partial<CompensationReviewData>;
  onFormChange?: (data: CompensationReviewData) => void;
}

export function CompensationReviewStep({ 
  onNext, 
  onBack, 
  employeeData, 
  isSubmitting, 
  defaultValues,
  onFormChange 
}: CompensationReviewStepProps) {
  const [salaryDisplay, setSalaryDisplay] = React.useState('');
  
  const form = useForm<CompensationReviewData>({
    resolver: zodResolver(compensationReviewSchema),
    defaultValues: {
      salary: defaultValues?.salary || undefined,
      currency: defaultValues?.currency || 'INR',
      department: defaultValues?.department || 'Engineering',
      employmentType: defaultValues?.employmentType || 'Full-time',
      agreementAccepted: defaultValues?.agreementAccepted || false
    }
  });

  // Track form changes
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (onFormChange && value) {
        onFormChange(value as CompensationReviewData);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onFormChange]);

  // Handle salary input
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = sanitizeNumericInput(e.target.value);
    const numericValue = rawValue ? parseInt(rawValue, 10) : undefined;
    
    setSalaryDisplay(rawValue);
    form.setValue('salary', numericValue || 0);
    form.trigger('salary');
  };

  const handleSalaryBlur = () => {
    const numericValue = form.getValues('salary');
    if (numericValue && numericValue > 0) {
      setSalaryDisplay(formatNumberWithCommas(numericValue));
    }
  };

  const handleSalaryWheel = (e: React.WheelEvent) => {
    e.preventDefault();
  };

  // Watch salary for live preview
  const currentSalary = form.watch('salary');

  const currencies = [
    { value: 'INR', label: 'INR (₹)' }
  ];

  const onSubmit = (data: CompensationReviewData) => {
    // Validate contract employees have end date
    if (data.employmentType === 'Contract' && !employeeData.lastDate) {
      form.setError('employmentType', {
        message: 'Contract employees must have an end date specified in the previous step'
      });
      return;
    }
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Compensation Details */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Compensation & Work Details</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Salary *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        className="h-11"
                        value={salaryDisplay}
                        onChange={handleSalaryChange}
                        onBlur={handleSalaryBlur}
                        onWheel={handleSalaryWheel}
                      />
                    </FormControl>
                    <FormDescription className="space-y-1">
                      {currentSalary && currentSalary > 0 ? (
                        <div className="text-muted-foreground text-sm">{convertNumberToWords(currentSalary)}</div>
                      ) : (
                        <div className="text-muted-foreground text-sm">Type the yearly gross salary to see it in words.</div>
                      )}
                    </FormDescription>
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
                    <FormControl>
                      <Input
                        value="INR (₹)"
                        disabled
                        className="h-11 bg-muted"
                      />
                    </FormControl>
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
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
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
                    <FormControl>
                      <Input
                        value="Full-time"
                        disabled
                        className="h-11 bg-muted"
                      />
                    </FormControl>
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
              <CardHeader className="sticky top-0 bg-background z-10 border-b">
                <CardTitle className="text-base">Complete Employee Record</CardTitle>
              </CardHeader>
              <ScrollArea className="h-96 w-full">
                <CardContent className="space-y-4 pt-4 pr-4">
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
                        <p className="capitalize">{employeeData.seniority?.replace('-', ' ') || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Start Date:</span>
                        <p>{employeeData.startDate ? format(employeeData.startDate, "PPP") : 'Not specified'}</p>
                      </div>
                      {employeeData.lastDate && (
                        <div>
                          <span className="font-medium text-muted-foreground">End Date:</span>
                          <p>{format(employeeData.lastDate, "PPP")}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-muted-foreground">Work Location:</span>
                        <p className="capitalize">{employeeData.workLocation}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                   {/* Compensation & Work Information */}
                  <div>
                    <h5 className="font-medium text-sm text-muted-foreground mb-2">Compensation & Work Details</h5>
                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Annual Salary:</span>
                         <p className="font-medium text-lg">
                           ₹ {form.watch('salary') ? formatNumberWithCommas(form.watch('salary')) : '0'}
                         </p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Department:</span>
                        <p className="capitalize">{form.watch('department') || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Employment Type:</span>
                        <p>Full-time</p>
                      </div>
                    </div>
                  </div>

                  {/* Job Description Preview */}
                  {employeeData.jobDescription && (
                    <>
                      <Separator />
                      <div>
                        <h5 className="font-medium text-sm text-muted-foreground mb-2">Job Description</h5>
                        <div className="p-3 bg-muted/30 rounded-md text-sm whitespace-pre-line">
                          {employeeData.jobDescription}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </Card>
            <p className="text-xs text-muted-foreground mt-2">Scroll to review full details.</p>
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
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Previous
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
