import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createNameValidator, createJobTitleValidator } from '@/lib/validationUtils';

const employeeDetailsSchema = z.object({
  firstName: createNameValidator('First name', 2, 50),
  lastName: createNameValidator('Last name', 1, 50),
  email: z.string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .transform(val => val.trim().toLowerCase()),
  phone: z.string()
    .min(1, 'Phone number is required')
    .refine(val => val.trim().length > 0, 'Phone number cannot be only whitespace')
    .transform(val => val.trim()),
  jobTitle: createJobTitleValidator(100),
  seniority: z.enum(['junior', 'mid-level', 'senior']),
  startDate: z.date(),
  workLocation: z.enum(['remote', 'office', 'hybrid']),
  jobDescription: z.string().optional()
});

export type EmployeeDetailsData = z.infer<typeof employeeDetailsSchema>;

interface EmployeeDetailsStepProps {
  onNext: (data: EmployeeDetailsData) => void;
  defaultValues?: Partial<EmployeeDetailsData>;
}

export function EmployeeDetailsStep({
  onNext,
  defaultValues
}: EmployeeDetailsStepProps) {
  const form = useForm<EmployeeDetailsData>({
    resolver: zodResolver(employeeDetailsSchema),
    defaultValues: {
      firstName: defaultValues?.firstName || '',
      lastName: defaultValues?.lastName || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      jobTitle: defaultValues?.jobTitle || '',
      seniority: defaultValues?.seniority || 'junior',
      startDate: defaultValues?.startDate,
      workLocation: defaultValues?.workLocation || 'remote',
      jobDescription: defaultValues?.jobDescription || ''
    }
  });

  const seniorityLevels = [{
    value: 'junior',
    label: 'Junior'
  }, {
    value: 'mid-level',
    label: 'Mid-Level'
  }, {
    value: 'senior',
    label: 'Senior'
  }];

  const workLocationOptions = [{
    value: 'remote',
    label: 'Remote'
  }, {
    value: 'office',
    label: 'Office'
  }, {
    value: 'hybrid',
    label: 'Hybrid'
  }];

  const onSubmit = (data: EmployeeDetailsData) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Provide the new team member's personal information and job details.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Personal Information</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField 
                control={form.control} 
                name="firstName" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" className="h-11" {...field} />
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
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="email" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="employee@company.com" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="phone" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
            </div>
          </div>

          {/* Job Information */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Job Information</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField 
                control={form.control} 
                name="jobTitle" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Software Engineer" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="seniority" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seniority Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select seniority level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {seniorityLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
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
                name="startDate" 
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "h-11 justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar 
                          mode="single" 
                          selected={field.value} 
                          onSelect={field.onChange} 
                          disabled={date => date < new Date()} 
                          initialFocus
                          defaultMonth={new Date()}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="workLocation" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select work location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workLocationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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

          {/* Job Description */}
          <FormField 
            control={form.control} 
            name="jobDescription" 
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the role, responsibilities, and requirements..." 
                    className="min-h-[150px] resize-y" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />

          <div className="flex justify-end pt-4">
            <Button type="submit" size="default">
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
