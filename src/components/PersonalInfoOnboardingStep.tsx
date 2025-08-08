
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useOnboardingContext, PersonalInfoData } from './EmployeeOnboardingFlow';
import { FileUploadZone } from './FileUploadZone';

const personalInfoSchema = z.object({
  profilePicture: z.instanceof(File).optional(),
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number'),
  genderIdentity: z.string().min(1, 'Please select your gender identity'),
  dateOfBirth: z.date().optional(),
}) satisfies z.ZodType<PersonalInfoData>;

type PersonalInfoForm = z.infer<typeof personalInfoSchema>;

const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say',
  'Other'
];

export function PersonalInfoOnboardingStep() {
  const { data, updatePersonalInfo } = useOnboardingContext();
  
  const form = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: data.personalInfo,
  });

  const handleFormChange = (field: keyof PersonalInfoData, value: any) => {
    updatePersonalInfo({ [field]: value });
    form.setValue(field as keyof PersonalInfoForm, value);
  };

  const handleFileUpload = (file: File | null) => {
    handleFormChange('profilePicture', file || undefined);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Let's start with your personal information
        </h3>
        <p className="text-muted-foreground">
          This helps us create your employee profile and ensure proper communication.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="space-y-2">
            <Label>Profile Picture (Optional)</Label>
            <FileUploadZone
              onFileSelect={handleFileUpload}
              accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }}
              maxSize={5 * 1024 * 1024} // 5MB
              currentFile={data.personalInfo.profilePicture}
              placeholder="Upload your profile photo"
              description="JPG or PNG, max 5MB"
              showPreview
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234567890"
                      className="h-11"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        field.onChange(value);
                        handleFormChange('phoneNumber', value);
                      }}
                      maxLength={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gender Identity */}
            <FormField
              control={form.control}
              name="genderIdentity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender Identity *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFormChange('genderIdentity', value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select gender identity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date of Birth */}
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Birth *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-11 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick your date of birth</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          handleFormChange('dateOfBirth', date);
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </Form>

      <div className="rounded-lg border bg-muted/20 p-4">
        <h4 className="font-medium text-foreground mb-2">Why do we need this information?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Profile picture helps your colleagues recognize you</li>
          <li>• Phone number is used for important communications and security</li>
          <li>• Gender identity helps us create an inclusive workplace</li>
          <li>• Date of birth is required for compliance and benefits eligibility</li>
        </ul>
      </div>
    </div>
  );
}
