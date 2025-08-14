import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { CreditCard, Building2, Shield, FileCheck } from 'lucide-react';
import { useOnboardingContext, BankDetailsData } from './EmployeeOnboardingFlow';
import { FileUploadZone } from './FileUploadZone';
const bankDetailsSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required').regex(/^\d{9,18}$/, 'Please enter a valid account number'),
  ifscCode: z.string().min(1, 'IFSC code is required').regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code'),
  cancelledCheque: z.any().refine(file => {
    if (!file) return false;
    return file instanceof File || file && typeof file === 'object' && file.name && file.size;
  }, {
    message: 'Bank proof document is required'
  }),
  hasUAN: z.boolean(),
  uanNumber: z.string().optional()
}).refine(data => {
  if (data.hasUAN && !data.uanNumber) {
    return false;
  }
  if (data.hasUAN && data.uanNumber && !/^\d{12}$/.test(data.uanNumber)) {
    return false;
  }
  return true;
}, {
  message: 'UAN number must be exactly 12 digits when UAN is selected',
  path: ['uanNumber']
}) satisfies z.ZodType<BankDetailsData>;
type BankDetailsForm = z.infer<typeof bankDetailsSchema>;
export function BankDetailsStep() {
  const {
    data,
    updateBankDetails,
    errors,
    setFormValidation
  } = useOnboardingContext();
  const form = useForm<BankDetailsForm>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: data.bankDetails,
    mode: "onChange"
  });

  // Sync React Hook Form validation state with context
  React.useEffect(() => {
    setFormValidation?.('bankDetails', form.formState.isValid);
  }, [form.formState.isValid, setFormValidation]);
  const handleFormChange = (field: keyof BankDetailsData, value: any) => {
    console.log(`Updating ${field}:`, value);
    updateBankDetails({
      [field]: value
    });
    form.setValue(field as keyof BankDetailsForm, value);
  };
  const handleFileUpload = (file: File | null) => {
    console.log('File upload:', file);
    handleFormChange('cancelledCheque', file || undefined);
  };
  const watchedHasUAN = form.watch('hasUAN');
  return <div className="space-y-6">
      <Form {...form}>
        <div className="space-y-6">
          {/* Bank Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-foreground">Bank Account Details</h4>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="bankName" render={({
              field
            }) => <FormItem>
                    <FormLabel>Bank Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., State Bank of India" className="h-11" {...field} onChange={e => {
                  field.onChange(e);
                  handleFormChange('bankName', e.target.value);
                }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="accountNumber" render={({
              field
            }) => <FormItem>
                    <FormLabel>Account Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account number" className="h-11" {...field} onChange={e => {
                  const value = e.target.value.replace(/\D/g, '');
                  field.onChange(value);
                  handleFormChange('accountNumber', value);
                }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="ifscCode" render={({
              field,
              fieldState
            }) => <FormItem>
                    <FormLabel>IFSC Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SBIN0001234" className={`h-11 ${fieldState.error ? 'border-destructive focus-visible:ring-destructive' : ''}`} {...field} onChange={e => {
                  const value = e.target.value.toUpperCase();
                  field.onChange(value);
                  handleFormChange('ifscCode', value);
                }} maxLength={11} />
                    </FormControl>
                    <FormMessage />
                    
                  </FormItem>} />

           
            </div>

            {/* Bank Proof Document */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                <Label>Bank Proof Document *</Label>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Upload a cancelled cheque, bank passbook page, or account statement
              </p>
              <FileUploadZone onFileSelect={handleFileUpload} currentFile={data.bankDetails.cancelledCheque} placeholder="Upload bank proof" description="PDF, JPG, PNG up to 5MB" accept={{
              'application/pdf': ['.pdf'],
              'image/*': ['.jpg', '.jpeg', '.png']
            }} required={true} />
              {errors.cancelledCheque && <p className="text-sm font-medium text-destructive">
                  {errors.cancelledCheque}
                </p>}
            </div>
          </div>

          {/* EPF Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <h4 className="font-semibold text-foreground">EPF (Employee Provident Fund)</h4>
            </div>

            <FormField control={form.control} name="hasUAN" render={({
            field
          }) => <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={checked => {
                  field.onChange(checked);
                  handleFormChange('hasUAN', checked);
                  if (!checked) {
                    handleFormChange('uanNumber', '');
                  }
                }} />
                    </FormControl>
                    <div>
                      <FormLabel className="text-base font-medium">
                        I have a UAN (Universal Account Number)
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Toggle this if you have worked before and have an existing UAN
                      </p>
                    </div>
                  </div>
                </FormItem>} />

            {watchedHasUAN && <FormField control={form.control} name="uanNumber" render={({
            field
          }) => <FormItem>
                    <FormLabel>UAN Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter 12-digit UAN number" className="h-11" {...field} onChange={e => {
                const value = e.target.value.replace(/\D/g, '');
                field.onChange(value);
                handleFormChange('uanNumber', value);
              }} maxLength={12} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />}
          </div>
        </div>
      </Form>
    </div>;
}