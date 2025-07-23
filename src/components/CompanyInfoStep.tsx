import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const companyInfoSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  legalName: z.string().min(1, 'Legal name is required'),
  country: z.string().min(1, 'Country is required'),
  employeeCount: z.string().min(1, 'Employee count is required'),
});

export interface CompanyInfoData {
  companyName: string;
  legalName: string;
  country: string;
  employeeCount: string;
}

interface CompanyInfoStepProps {
  onboardingData: any;
  onStepComplete: () => void;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function CompanyInfoStep({ onboardingData, onStepComplete, onNext, onPrev, canGoNext, canGoPrev }: CompanyInfoStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<CompanyInfoData>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      companyName: onboardingData?.company_info?.data?.company_name || '',
      legalName: onboardingData?.company_info?.data?.company_legal_name || '',
      country: onboardingData?.company_info?.data?.country || '',
      employeeCount: onboardingData?.company_info?.data?.employee_count || '',
    }
  });

  const onSubmit = async (data: CompanyInfoData) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Create or update organization
      const { data: organizationId, error } = await supabase.rpc('upsert_organization', {
        p_organization_id: onboardingData?.organization?.id || null,
        p_name: data.companyName,
        p_legal_name: data.legalName,
        p_country: data.country,
        p_employee_count: data.employeeCount as any,
      });

      if (error) throw error;

      // Update profile with organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: organizationId })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast.success('Company information saved successfully');
      onStepComplete();
      if (canGoNext) {
        onNext();
      }
    } catch (error) {
      console.error('Error saving company info:', error);
      toast.error('Failed to save company information');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="legalName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter legal company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="IN">India</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="employeeCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Employees</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee count" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1-10">1-10</SelectItem>
                  <SelectItem value="11-50">11-50</SelectItem>
                  <SelectItem value="51-200">51-200</SelectItem>
                  <SelectItem value="201-500">201-500</SelectItem>
                  <SelectItem value="500+">500+</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            disabled={!canGoPrev}
          >
            Previous
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Next'}
          </Button>
        </div>
      </form>
    </Form>
  );
}