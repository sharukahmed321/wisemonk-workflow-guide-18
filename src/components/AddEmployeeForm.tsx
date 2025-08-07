import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract']),
  salary: z.number().min(0, 'Salary must be a positive number'),
  startDate: z.date(),
  birthday: z.date().optional(),
  gender: z.enum(['Male', 'Female'], { message: 'Gender is required' }),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface AddEmployeeFormProps {
  onSuccess?: () => void;
}

export function AddEmployeeForm({
  onSuccess
}: AddEmployeeFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userOrganizationId, setUserOrganizationId] = useState<string | null>(null);
  const [isLoadingOrganization, setIsLoadingOrganization] = useState(true);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      department: '',
      employmentType: 'Full-time' as const,
      salary: 0,
      gender: undefined,
      birthday: undefined,
    }
  });

  // Fetch user's organization ID on component mount
  useEffect(() => {
    const fetchUserOrganization = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Error",
            description: "You must be logged in to add employees.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          toast({
            title: "Error",
            description: "Failed to fetch user organization. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (!profile?.organization_id) {
          toast({
            title: "Organization Required",
            description: "You must set up your organization before adding employees.",
            variant: "destructive",
          });
          navigate('/dashboard/settings');
          return;
        }

        setUserOrganizationId(profile.organization_id);
      } catch (error) {
        console.error('Error fetching organization:', error);
        toast({
          title: "Error",
          description: "Failed to fetch organization information.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingOrganization(false);
      }
    };

    fetchUserOrganization();
  }, [navigate, toast]);

  const employmentTypes = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Contract', label: 'Contract' }
  ];

  const departments = [
    'Engineering',
    'Marketing',
    'Sales',
    'HR',
    'Finance',
    'Design',
    'Operations'
  ];

  const generateEmployeeId = () => {
    // Generate a simple employee ID with format EMP + 3 digit number
    const randomNum = Math.floor(Math.random() * 999) + 1;
    return `EMP${randomNum.toString().padStart(3, '0')}`;
  };

  const onSubmit = async (data: EmployeeFormData) => {
    if (!userOrganizationId) {
      toast({
        title: "Error",
        description: "Organization information not available. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const employeeId = generateEmployeeId();
      
      console.log('Form submission started with data:', { salary: data.salary, employeeId });

      // Get current session and user information
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please log in again to add employees."
        });
        setIsSubmitting(false);
        return;
      }

      console.log('Session found:', { userId: session.user.id, email: session.user.email });

      // Get current user's profile to store in added_by_email
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Fallback to session email if profile fetch fails
        console.log('Using session email as fallback:', session.user.email);
      }

      const clientEmail = currentUserProfile?.email || session.user.email;
      console.log('Client email to store:', clientEmail);
      
      // Map gender from Male/Female to Son/Daughter
      const genderMapping = {
        'Male': 'Son',
        'Female': 'Daughter'
      };

        const employeeData = {
          employee_id: employeeId,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          job_title: data.jobTitle,
          department: data.department,
          employment_type: data.employmentType,
          annual_gross_salary: data.salary, // Use annual_gross_salary for trigger calculation
          salary: data.salary, // Also set legacy salary field for backward compatibility
          start_date: data.startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          status: 'Invited', // Proper status for new employees
          birthday: data.birthday ? data.birthday.toISOString().split('T')[0] : null,
          gender: genderMapping[data.gender], // Map to Son/Daughter
          organization_id: userOrganizationId, // Include organization ID
          added_by_user_id: session.user.id, // Track who added the employee
          added_by_email: clientEmail, // Store client's email
        };

        console.log('Inserting employee data:', employeeData);

        const { error } = await supabase
          .from('employees')
          .insert(employeeData);

      if (error) throw error;

      // Send employment agreement email
      try {
        // Fetch organization details
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', userOrganizationId)
          .single();

        if (orgError) {
          console.error('Error fetching organization:', orgError);
          toast({
            title: "Warning",
            description: "Employee added but failed to send employment agreement email.",
            variant: "destructive",
          });
        } else {
          // Send employment agreement email
          const { error: emailError } = await supabase.functions.invoke('send-employment-email', {
            body: {
              employeeFirstName: data.firstName,
              employeeEmail: data.email,
              organizationName: orgData.name
            }
          });

          if (emailError) {
            console.error('Error sending employment email:', emailError);
            toast({
              title: "Warning",
              description: "Employee added but failed to send employment agreement email.",
              variant: "destructive",
            });
          }
        }
      } catch (emailError) {
        console.error('Error sending employment email:', emailError);
        toast({
          title: "Warning",
          description: "Employee added but failed to send employment agreement email.",
          variant: "destructive",
        });
      }

      setShowSuccess(true);
      toast({
        title: "Success!",
        description: `${data.firstName} ${data.lastName} has been added to your team.`,
      });

      // Auto-redirect after success
      setTimeout(() => {
        onSuccess?.();
        navigate('/dashboard/people');
      }, 2000);
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while fetching organization
  if (isLoadingOrganization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Loading...</h3>
              <p className="text-muted-foreground mt-1">
                Fetching organization information...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSuccess) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Employee Added Successfully!</h3>
              <p className="text-muted-foreground mt-1">
                {form.getValues('firstName')} {form.getValues('lastName')} has been added to your team.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </div>
          </CardContent>
        </Card>
      </div>;
  }

  return <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Add New Employee
          </CardTitle>
          <p className="text-muted-foreground">
            Fill in the employee details to add them to your team.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="firstName" render={({
                  field
                }) => <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="lastName" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="email" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="employee@company.com" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                   <FormField control={form.control} name="phone" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                   <FormField control={form.control} name="gender" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover border border-border z-50">
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>} />

                   <FormField control={form.control} name="birthday" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Birthday</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-11 w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>} />
                </div>
              </div>

              {/* Work Information */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Work Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="jobTitle" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Job Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Software Engineer" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                   <FormField control={form.control} name="department" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Department *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map(dept => <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>} />

                   <FormField control={form.control} name="employmentType" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Employment Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select employment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employmentTypes.map(type => <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>} />

                   <FormField control={form.control} name="salary" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Annual Salary *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="75000" 
                            className="h-11" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                   <FormField control={form.control} name="startDate" render={({
                  field
                }) => <FormItem className="flex flex-col">
                        <FormLabel>Start Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("h-11 pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick start date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>} />
                </div>
              </div>


              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard/people')} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Adding Employee...' : 'Add Employee'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>;
}
