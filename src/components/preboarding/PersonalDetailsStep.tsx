
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker';
import { User, MapPin } from 'lucide-react';
import { createAddressValidator, createCityValidator, createStateValidator, createPostalCodeValidator } from "@/lib/validationUtils";

const personalDetailsSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  fatherName: z.string().min(2, 'Father\'s name must be at least 2 characters'),
  dateOfBirth: z.date(),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar number must be 12 digits'),
  addressLine1: createAddressValidator('Address Line 1'),
  addressLine2: createAddressValidator('Address Line 2'),
  city: createCityValidator(),
  state: createStateValidator(),
  pincode: createPostalCodeValidator('IN')
});

type PersonalDetailsData = z.infer<typeof personalDetailsSchema>;

interface PersonalDetailsStepProps {
  data: PersonalDetailsData;
  onComplete: (data: PersonalDetailsData) => void;
  onPrevious?: () => void;
}

export function PersonalDetailsStep({
  data,
  onComplete,
  onPrevious
}: PersonalDetailsStepProps) {
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
              name="fullName" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Full name *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" className="h-11" {...field} />
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
                    Father's name *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField 
              control={form.control} 
              name="dateOfBirth" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    DOB *
                  </FormLabel>
                  <FormControl>
                    <DateOfBirthPicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select your date of birth"
                      dateFormat="DD/MM/YYYY"
                      className="h-11"
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
                    Aadhar No. *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your aadhar no." className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
          </div>

          {/* Address Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pt-6 pb-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h4 className="text-lg font-medium text-foreground">Address Information</h4>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <FormField 
                control={form.control} 
                name="addressLine1" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Address Line 1 *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Address Line 1" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="addressLine2" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Address Line 2 *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Address Line 2" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="city" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      City *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="City" className="h-11" {...field} />
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
                    <FormLabel className="flex items-center gap-2">
                      State *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="State" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="pincode" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Pincode *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Pincode" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={onPrevious} disabled={!onPrevious}>
              Previous
            </Button>
            <Button type="submit" className="px-8">
              Continue
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
