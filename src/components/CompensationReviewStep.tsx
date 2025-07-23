
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, ArrowLeft } from 'lucide-react';
import { EmployeeDetailsData } from './EmployeeDetailsStep';

const compensationReviewSchema = z.object({
  salary: z.number().min(1, 'Salary is required'),
  currency: z.string().min(1, 'Currency is required'),
  agreementAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the agreement to proceed',
  }),
});

export type CompensationReviewData = z.infer<typeof compensationReviewSchema>;

interface CompensationReviewStepProps {
  onNext: (data: CompensationReviewData) => void;
  onBack: () => void;
  employeeData: EmployeeDetailsData;
  isSubmitting: boolean;
  defaultValues?: Partial<CompensationReviewData>;
}

export function CompensationReviewStep({
  onNext,
  onBack,
  employeeData,
  isSubmitting,
  defaultValues
}: CompensationReviewStepProps) {
  const form = useForm<CompensationReviewData>({
    resolver: zodResolver(compensationReviewSchema),
    defaultValues: {
      salary: defaultValues?.salary || 0,
      currency: defaultValues?.currency || 'USD',
      agreementAccepted: defaultValues?.agreementAccepted || false,
    },
  });

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'INR', label: 'INR (₹)' },
  ];

  const onSubmit = (data: CompensationReviewData) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Compensation Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Compensation Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Salary</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="75000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Review Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Review Information</h3>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employee Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">
                    {employeeData.firstName} {employeeData.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{employeeData.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Job Title</p>
                  <p className="text-sm text-muted-foreground">{employeeData.jobTitle}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-sm text-muted-foreground">
                    {employeeData.startDate.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">Compensation</p>
                <p className="text-sm text-muted-foreground">
                  {form.watch('salary').toLocaleString()} {form.watch('currency')} annually
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agreement */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="agreementAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I confirm that all information provided is accurate and complete.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Employee...
              </>
            ) : (
              'Complete & Add Employee'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
