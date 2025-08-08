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
import { CalendarIcon, User, Phone, Heart } from 'lucide-react';
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
  return <div className="space-y-8">
      {/* Profile Picture Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-border/40">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Profile Picture</h3>
            
          </div>
        </div>
        
        <FileUploadZone onFileSelect={handleFileUpload} accept={{
        'image/*': ['.jpg', '.jpeg', '.png']
      }} maxSize={5 * 1024 * 1024} currentFile={data.personalInfo.profilePicture} placeholder="Choose File or drag and drop" description="JPG or PNG, max 5MB" showPreview />
      </div>

      {/* Contact Information Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-border/40">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
            
          </div>
        </div>

        <Form {...form}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Phone Number */}
            <FormField control={form.control} name="phoneNumber" render={({
            field
          }) => <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Phone Number <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 10-digit phone number" className="h-11 bg-background border-input" {...field} onChange={e => {
                const value = e.target.value.replace(/\D/g, '');
                field.onChange(value);
                handleFormChange('phoneNumber', value);
              }} maxLength={10} />
                  </FormControl>
                  <FormMessage className="text-xs" />
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
        </Form>
      </div>
    </div>;
}