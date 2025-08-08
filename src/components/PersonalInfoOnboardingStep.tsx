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
  phoneNumber: z.string().min(1, 'Phone number is required').regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number'),
  genderIdentity: z.string().min(1, 'Please select your gender identity'),
  dateOfBirth: z.date().optional()
}) satisfies z.ZodType<PersonalInfoData>;
type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'];
export function PersonalInfoOnboardingStep() {
  const {
    data,
    updatePersonalInfo
  } = useOnboardingContext();
  const form = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: data.personalInfo
  });
  const handleFormChange = (field: keyof PersonalInfoData, value: any) => {
    updatePersonalInfo({
      [field]: value
    });
    form.setValue(field as keyof PersonalInfoForm, value);
  };
  const handleFileUpload = (file: File | null) => {
    handleFormChange('profilePicture', file || undefined);
  };
  return <div className="space-y-6">
      

      <Form {...form}>
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="space-y-2">
            <Label>Profile Picture (Optional)</Label>
            <FileUploadZone onFileSelect={handleFileUpload} accept={{
            'image/*': ['.jpg', '.jpeg', '.png']
          }} maxSize={5 * 1024 * 1024} // 5MB
          currentFile={data.personalInfo.profilePicture} placeholder="Upload your profile photo" description="JPG or PNG, max 5MB" showPreview />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Phone Number */}
            <FormField control={form.control} name="phoneNumber" render={({
            field
          }) => <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890" className="h-11" {...field} onChange={e => {
                const value = e.target.value.replace(/\D/g, '');
                field.onChange(value);
                handleFormChange('phoneNumber', value);
              }} maxLength={10} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            {/* Gender Identity */}
            <FormField control={form.control} name="genderIdentity" render={({
            field
          }) => {}} />

            {/* Date of Birth */}
            <FormField control={form.control} name="dateOfBirth" render={({
            field
          }) => {}} />
          </div>
        </div>
      </Form>

      
    </div>;
}