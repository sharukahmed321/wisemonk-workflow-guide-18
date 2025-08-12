import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, AlertCircle } from 'lucide-react';
import { 
  validateAadhaarNumber, 
  validateIFSCCode, 
  validateBankAccountNumber,
  validatePANNumber,
  validateUANNumber,
  sanitizeForLogging
} from '@/lib/dataValidation';

const enhancedPersonalDetailsSchema = z.object({
  aadhaarNumber: z.string()
    .min(1, 'Aadhaar number is required')
    .refine((value) => {
      const validation = validateAadhaarNumber(value);
      return validation.isValid;
    }, 'Invalid Aadhaar number'),
  
  panNumber: z.string()
    .min(1, 'PAN number is required')
    .refine((value) => {
      const validation = validatePANNumber(value);
      return validation.isValid;
    }, 'Invalid PAN number format'),
  
  bankAccountNumber: z.string()
    .min(1, 'Bank account number is required')
    .refine((value) => {
      const validation = validateBankAccountNumber(value);
      return validation.isValid;
    }, 'Invalid bank account number'),
  
  ifscCode: z.string()
    .min(1, 'IFSC code is required')
    .refine((value) => {
      const validation = validateIFSCCode(value);
      return validation.isValid;
    }, 'Invalid IFSC code format'),
  
  uanNumber: z.string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      const validation = validateUANNumber(value);
      return validation.isValid;
    }, 'Invalid UAN number format'),
  
  bankName: z.string().min(1, 'Bank name is required'),
  fullName: z.string().min(1, 'Full name is required'),
  fatherName: z.string().min(1, 'Father name is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string()
    .min(6, 'Pincode must be 6 digits')
    .max(6, 'Pincode must be 6 digits')
    .regex(/^\d{6}$/, 'Pincode must contain only digits'),
});

type EnhancedPersonalDetailsFormData = z.infer<typeof enhancedPersonalDetailsSchema>;

interface EnhancedPersonalDetailsFormProps {
  initialData?: Partial<EnhancedPersonalDetailsFormData>;
  onSubmit: (data: EnhancedPersonalDetailsFormData) => void;
  isLoading?: boolean;
}

export function EnhancedPersonalDetailsForm({ 
  initialData, 
  onSubmit, 
  isLoading = false 
}: EnhancedPersonalDetailsFormProps) {
  const form = useForm<EnhancedPersonalDetailsFormData>({
    resolver: zodResolver(enhancedPersonalDetailsSchema),
    defaultValues: {
      aadhaarNumber: initialData?.aadhaarNumber || '',
      panNumber: initialData?.panNumber || '',
      bankAccountNumber: initialData?.bankAccountNumber || '',
      ifscCode: initialData?.ifscCode || '',
      uanNumber: initialData?.uanNumber || '',
      bankName: initialData?.bankName || '',
      fullName: initialData?.fullName || '',
      fatherName: initialData?.fatherName || '',
      addressLine1: initialData?.addressLine1 || '',
      addressLine2: initialData?.addressLine2 || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      pincode: initialData?.pincode || '',
    },
  });

  const handleSubmit = (data: EnhancedPersonalDetailsFormData) => {
    // Log sanitized data for security auditing
    console.log('Personal details form submitted with sanitized data:', {
      ...data,
      aadhaarNumber: sanitizeForLogging(data.aadhaarNumber),
      panNumber: sanitizeForLogging(data.panNumber),
      bankAccountNumber: sanitizeForLogging(data.bankAccountNumber),
    });
    
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your personal information is encrypted and secured. All data validation includes checksum verification.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your full name as per official documents"
                      disabled={isLoading}
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
                  <FormLabel>Father's Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your father's name"
                      disabled={isLoading}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="aadhaarNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aadhaar Number *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="XXXX XXXX XXXX"
                      disabled={isLoading}
                      maxLength={14}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    ✓ Checksum validated • ✓ Encrypted storage
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="panNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN Number *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ABCDE1234F"
                      disabled={isLoading}
                      maxLength={10}
                      style={{ textTransform: 'uppercase' }}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Format: 5 letters + 4 digits + 1 letter
                  </p>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Account Number *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your bank account number"
                      disabled={isLoading}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    ✓ Format validated • ✓ Encrypted storage
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ifscCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IFSC Code *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ABCD0123456"
                      disabled={isLoading}
                      maxLength={11}
                      style={{ textTransform: 'uppercase' }}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Format: 4 letters + 0 + 6 alphanumeric
                  </p>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your bank name"
                      disabled={isLoading}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uanNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UAN Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123456789012 (12 digits)"
                      disabled={isLoading}
                      maxLength={12}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Optional • Universal Account Number for PF
                  </p>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="addressLine1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 1 *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="House/Flat number, Building name, Street"
                    disabled={isLoading}
                    {...field} 
                  />
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
                <FormLabel>Address Line 2</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Area, Landmark (Optional)"
                    disabled={isLoading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your city"
                      disabled={isLoading}
                      {...field} 
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
                  <FormLabel>State *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your state"
                      disabled={isLoading}
                      {...field} 
                    />
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
                  <FormLabel>Pincode *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123456"
                      disabled={isLoading}
                      maxLength={6}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading ? 'Saving...' : 'Save Personal Details'}
          </Button>
        </form>
      </Form>
    </div>
  );
}