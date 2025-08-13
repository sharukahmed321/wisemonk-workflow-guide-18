
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker';
import { useToast } from "@/components/ui/use-toast";
import { useAutoSave } from '@/hooks/useAutoSave';
import { SaveIndicator } from '@/components/SaveIndicator';
import { 
  createNameValidator, 
  createAddressValidator, 
  createCityValidator, 
  createStateValidator, 
  createPostalCodeValidator,
  createDateOfBirthValidator,
  sanitizeInput,
  numericOnly
} from '@/lib/validationUtils';
import { validateAadhaarNumber } from '@/lib/dataValidation';

// Zod schema for comprehensive validation
const personalDetailsSchema = z.object({
  fullName: createNameValidator('Full name', 2, 100),
  fatherName: createNameValidator("Father's name", 2, 100),
  dateOfBirth: createDateOfBirthValidator(),
  aadhaarNumber: z.string()
    .min(1, 'Aadhaar number is required')
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 12, 'Aadhaar number must be exactly 12 digits')
    .refine(val => {
      const validation = validateAadhaarNumber(val);
      return validation.isValid;
    }, 'Invalid Aadhaar number - checksum verification failed'),
  addressLine1: createAddressValidator('Address Line 1', 200),
  addressLine2: createAddressValidator('Address Line 2', 200),
  city: createCityValidator(2, 100),
  state: createStateValidator(100),
  pincode: createPostalCodeValidator('india')
});

type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;

interface PersonalDetailsStepProps {
  data: {
    fullName: string;
    fatherName: string;
    dateOfBirth?: Date;
    aadhaarNumber: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  onComplete: (data: any) => void;
  onPrevious: () => void;
  onDataChange?: (data: any) => void;
  employeeId?: string;
}

export function PersonalDetailsStep({ data, onComplete, onPrevious, onDataChange, employeeId }: PersonalDetailsStepProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { toast } = useToast();

  // Initialize form with react-hook-form and Zod validation
  const form = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      fullName: sanitizeInput(data?.fullName || ''),
      fatherName: sanitizeInput(data?.fatherName || ''),
      dateOfBirth: data?.dateOfBirth || undefined,
      aadhaarNumber: data?.aadhaarNumber || '',
      addressLine1: sanitizeInput(data?.addressLine1 || ''),
      addressLine2: sanitizeInput(data?.addressLine2 || ''),
      city: sanitizeInput(data?.city || ''),
      state: sanitizeInput(data?.state || ''),
      pincode: data?.pincode || ''
    },
    mode: 'onChange' // Enable real-time validation
  });

  const formData = form.watch(); // Watch all form values for auto-save

  // Auto-save functionality
  const { forceSave } = useAutoSave({
    key: `preboarding_personal_details_${employeeId || 'temp'}`,
    data: formData,
    enabled: !!employeeId,
    onSave: () => {
      setSaveStatus('saved');
      if (onDataChange) {
        onDataChange(formData);
      }
    }
  });

  // Update parent component when form data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  // Update save status
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const onSubmit = (validatedData: PersonalDetailsFormData) => {
    forceSave(); // Force save before completing
    onComplete(validatedData);
  };

  const handleFormError = () => {
    toast({
      variant: "destructive",
      title: "Please correct the errors below",
      description: "All fields must be properly filled before proceeding.",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold text-foreground">Personal Details</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please provide your personal information for our records
            </CardDescription>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, handleFormError)} className="space-y-6">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Full Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your full name"
                      onChange={(e) => {
                        setSaveStatus('saving');
                        field.onChange(e);
                      }}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Father's Name */}
            <FormField
              control={form.control}
              name="fatherName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Father's Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter father's name"
                      onChange={(e) => {
                        setSaveStatus('saving');
                        field.onChange(e);
                      }}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date of Birth */}
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Date of Birth *
                  </FormLabel>
                  <FormControl>
                    <DateOfBirthPicker
                      value={field.value}
                      onChange={(date) => {
                        setSaveStatus('saving');
                        field.onChange(date);
                      }}
                      placeholder="Select your date of birth"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Aadhaar Number */}
            <FormField
              control={form.control}
              name="aadhaarNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Aadhaar Number *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter 12-digit Aadhaar number"
                      onChange={(e) => {
                        setSaveStatus('saving');
                        const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                        field.onChange(value);
                      }}
                      className="w-full"
                      maxLength={12}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      {validateAadhaarNumber(field.value || '').isValid ? 
                        '✓ Valid Aadhaar number' : 
                        field.value?.length === 12 ? '✗ Invalid checksum' : 'Enter 12 digits'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(field.value || '').length}/12
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Line 1 */}
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Address Line 1 *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Street address, apartment, suite, etc."
                      onChange={(e) => {
                        setSaveStatus('saving');
                        field.onChange(e);
                      }}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Line 2 */}
            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Address Line 2 *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Landmark, area, district"
                      onChange={(e) => {
                        setSaveStatus('saving');
                        field.onChange(e);
                      }}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City and State */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      City *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter city"
                        onChange={(e) => {
                          setSaveStatus('saving');
                          field.onChange(e);
                        }}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      State *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter state"
                        onChange={(e) => {
                          setSaveStatus('saving');
                          field.onChange(e);
                        }}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pincode */}
            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Pincode *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter 6-digit pincode"
                      onChange={(e) => {
                        setSaveStatus('saving');
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        field.onChange(value);
                      }}
                      className="w-full"
                      maxLength={6}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground">
                    {field.value?.length === 6 ? '✓ Valid pincode format' : 'Enter 6 digits'}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                className="px-6"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="px-6"
                disabled={!form.formState.isValid}
              >
                Next
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
