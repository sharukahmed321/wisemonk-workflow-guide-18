import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const addressSchema = z.object({
  businessAddress: z.string().min(1, 'Business address is required'),
  businessCity: z.string().min(1, 'City is required'),
  businessState: z.string().min(1, 'State/Province is required'),
  businessPostalCode: z.string().min(1, 'Postal code is required'),
});

export interface AddressData {
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessPostalCode: string;
}

interface AddressStepProps {
  onboardingData?: any;
  onStepComplete?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  onComplete?: () => void;
}

export function AddressStep({ 
  onboardingData, 
  onStepComplete, 
  onNext, 
  onPrev, 
  canGoNext, 
  canGoPrev,
  onComplete 
}: AddressStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      businessAddress: onboardingData?.address_info?.data?.business_address || '',
      businessCity: onboardingData?.address_info?.data?.business_city || '',
      businessState: onboardingData?.address_info?.data?.business_state || '',
      businessPostalCode: onboardingData?.address_info?.data?.business_postal_code || '',
    }
  });

  const onSubmit = async (data: AddressData) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update organization with address information
      const { error } = await supabase.rpc('upsert_organization', {
        p_organization_id: onboardingData?.organization?.id || null,
        p_business_address: data.businessAddress,
        p_business_city: data.businessCity,
        p_business_state: data.businessState,
        p_business_postal_code: data.businessPostalCode,
      });

      if (error) throw error;

      toast.success('Address information saved successfully');
      
      if (onStepComplete) {
        onStepComplete();
      }
      
      if (onComplete) {
        onComplete();
      } else if (canGoNext && onNext) {
        onNext();
      }
    } catch (error) {
      console.error('Error saving address info:', error);
      toast.error('Failed to save address information');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Business Address</h1>
        <p className="text-muted-foreground">Enter your company's business address</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="businessAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter business address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="businessCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter city" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter state or province" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="businessPostalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter postal code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between">
            {onPrev && (
              <Button
                type="button"
                variant="outline"
                onClick={onPrev}
                disabled={!canGoPrev}
              >
                Previous
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className={!onPrev ? 'w-full' : ''}>
              {isLoading ? 'Saving...' : 'Save Address'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}