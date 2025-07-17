import React, { useState } from 'react';
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
const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  seniority: z.enum(['junior', 'mid-level', 'senior']),
  jobDescription: z.string().optional(),
  startDate: z.date(),
  workLocation: z.enum(['remote', 'office', 'hybrid'])
});
type EmployeeFormData = z.infer<typeof employeeSchema>;
interface AddEmployeeFormProps {
  onSuccess?: () => void;
}
export function AddEmployeeForm({
  onSuccess
}: AddEmployeeFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGeneratingJD, setIsGeneratingJD] = useState(false);
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      seniority: 'junior' as const,
      jobDescription: '',
      workLocation: 'remote'
    }
  });
  const seniorityLevels = [
    { value: 'junior', label: 'Junior' },
    { value: 'mid-level', label: 'Mid-Level' },
    { value: 'senior', label: 'Senior' }
  ];

  const generateJobDescription = async () => {
    const jobTitle = form.getValues('jobTitle');
    const seniority = form.getValues('seniority');
    
    if (!jobTitle) {
      return;
    }
    
    setIsGeneratingJD(true);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional HR specialist creating job descriptions for employment agreements. Generate comprehensive, professional job descriptions that are legally appropriate and industry-standard.'
            },
            {
              role: 'user',
              content: `Generate a professional job description for a ${seniority} level ${jobTitle} position. Include key responsibilities, requirements, qualifications, and benefits. Format it professionally for an employment agreement.`
            }
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate job description');
      }

      const data = await response.json();
      const generatedJD = data.choices[0].message.content;
      
      form.setValue('jobDescription', generatedJD);
    } catch (error) {
      console.error('Error generating job description:', error);
      
      // Fallback to template-based generation
      const templates = {
        junior: `We are seeking a motivated Junior ${jobTitle} to join our dynamic team.

Key Responsibilities:
• Assist senior team members with daily tasks
• Learn and apply best practices
• Participate in team meetings and training sessions
• Complete assigned projects under supervision
• Collaborate with cross-functional teams

Requirements:
• Bachelor's degree or equivalent experience
• 0-2 years of relevant experience
• Strong willingness to learn
• Good communication skills
• Basic understanding of relevant technologies

What We Offer:
• Competitive salary and benefits package
• Professional development opportunities
• Collaborative and inclusive work environment
• Flexible work arrangements
• Career growth opportunities`,
        'mid-level': `We are looking for an experienced ${jobTitle} to join our team.

Key Responsibilities:
• Lead and execute projects independently
• Mentor junior team members
• Collaborate with stakeholders on requirements
• Implement solutions and best practices
• Contribute to team processes and improvements

Requirements:
• Bachelor's degree or equivalent experience
• 3-5 years of relevant experience
• Proven track record of successful projects
• Strong technical and communication skills
• Experience with team collaboration

What We Offer:
• Competitive salary and benefits package
• Professional development opportunities
• Collaborative and inclusive work environment
• Flexible work arrangements
• Career growth opportunities`,
        senior: `We seek a highly experienced Senior ${jobTitle} to join our leadership team.

Key Responsibilities:
• Lead complex projects and initiatives
• Architect and design solutions
• Mentor team members and drive technical excellence
• Collaborate with leadership on strategic decisions
• Drive innovation and process improvements

Requirements:
• Bachelor's degree or equivalent experience
• 5+ years of relevant experience
• Proven leadership and technical expertise
• Excellent communication and strategic thinking
• Experience leading teams and projects

What We Offer:
• Competitive salary and benefits package
• Professional development opportunities
• Collaborative and inclusive work environment
• Flexible work arrangements
• Career growth opportunities`
      };
      
      const fallbackJD = templates[seniority] || templates.junior;
      form.setValue('jobDescription', fallbackJD);
    }
    
    setIsGeneratingJD(false);
  };
  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setShowSuccess(true);

    // Auto-redirect after success
    setTimeout(() => {
      onSuccess?.();
      navigate('/dashboard');
    }, 2000);
  };
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

                  <FormField control={form.control} name="seniority" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Seniority *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select seniority level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {seniorityLevels.map(level => <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
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
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={date => date < new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>} />
                </div>
                
                {/* Job Description */}
                <div className="mt-6">
                  <FormField control={form.control} name="jobDescription" render={({
                    field
                  }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Job Description</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateJobDescription}
                          disabled={isGeneratingJD || !form.getValues('jobTitle')}
                          className="flex items-center gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          {isGeneratingJD ? 'Generating...' : 'Generate JD using AI'}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the role, responsibilities, and requirements..." 
                          className="min-h-[150px] resize-y"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Work Location */}
              <div>
                
                
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
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