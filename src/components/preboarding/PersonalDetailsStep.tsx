
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, Phone, Mail, MapPin, UserCheck } from 'lucide-react';

const personalDetailsSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  alternateEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  currentAddress: z.string().min(10, 'Current address must be at least 10 characters'),
  permanentAddress: z.string().min(10, 'Permanent address must be at least 10 characters'),
  fatherName: z.string().min(2, 'Father\'s name must be at least 2 characters'),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar number must be 12 digits')
});

type PersonalDetailsData = z.infer<typeof personalDetailsSchema>;

interface PersonalDetailsStepProps {
  data: PersonalDetailsData;
  onComplete: (data: PersonalDetailsData) => void;
  onPrevious?: () => void;
}

export function PersonalDetailsStep({ data, onComplete, onPrevious }: PersonalDetailsStepProps) {
  const form = useForm<PersonalDetailsData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: data
  });

  const onSubmit = (formData: PersonalDetailsData) => {
    onComplete(formData);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">Personal Details</h3>
        <p className="text-muted-foreground">
          Please provide your personal information to complete your profile
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 10-digit phone number" 
                      className="h-11"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alternateEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Alternate Email
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="alternate@example.com" 
                      className="h-11"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Current Address *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your current address" 
                      className="h-11"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permanentAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Permanent Address *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your permanent address" 
                      className="h-11"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fatherName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Father's Name *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter father's name" 
                      className="h-11"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aadhaarNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Aadhaar Number *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 12-digit Aadhaar number" 
                      className="h-11"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={!onPrevious}
            >
              Previous
            </Button>
            <Button type="submit" className="px-8">
              Continue to Background Verification
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
