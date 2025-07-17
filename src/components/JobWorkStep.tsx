import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const jobWorkSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  seniority: z.enum(['junior', 'mid-level', 'senior']),
  startDate: z.date(),
  workLocation: z.enum(['remote', 'office', 'hybrid']),
  jobDescription: z.string().min(1, 'Job description is required')
});

export interface JobWorkData {
  jobTitle: string;
  seniority: 'junior' | 'mid-level' | 'senior';
  startDate: Date;
  workLocation: 'remote' | 'office' | 'hybrid';
  jobDescription: string;
}

interface JobWorkStepProps {
  onNext: (data: JobWorkData) => void;
  onBack: () => void;
  defaultValues?: Partial<JobWorkData>;
}

export function JobWorkStep({ onNext, onBack, defaultValues }: JobWorkStepProps) {
  const [isGeneratingJD, setIsGeneratingJD] = useState(false);
  const [hasGeneratedJD, setHasGeneratedJD] = useState(false);

  const form = useForm<JobWorkData>({
    resolver: zodResolver(jobWorkSchema),
    defaultValues: {
      jobTitle: defaultValues?.jobTitle || '',
      seniority: defaultValues?.seniority || 'junior',
      startDate: defaultValues?.startDate,
      workLocation: defaultValues?.workLocation || 'remote',
      jobDescription: defaultValues?.jobDescription || ''
    }
  });

  const seniorityLevels = [
    { value: 'junior', label: 'Junior' },
    { value: 'mid-level', label: 'Mid-Level' },
    { value: 'senior', label: 'Senior' }
  ];

  const workLocationOptions = [
    { value: 'remote', label: 'Remote' },
    { value: 'office', label: 'Office' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const generateJobDescription = async () => {
    const jobTitle = form.getValues('jobTitle');
    const seniority = form.getValues('seniority');
    
    if (!jobTitle) {
      return;
    }
    
    setIsGeneratingJD(true);
    
    try {
      // Template-based generation with better structure
      const templates = {
        junior: `We are seeking a motivated Junior ${jobTitle} to join our dynamic team.

Key Responsibilities:
• Assist senior team members with daily tasks and projects
• Learn and apply industry best practices and company standards
• Participate in team meetings, training sessions, and code reviews
• Complete assigned projects under guidance and supervision
• Collaborate effectively with cross-functional teams
• Contribute to documentation and knowledge sharing

Requirements:
• Bachelor's degree in relevant field or equivalent practical experience
• 0-2 years of professional experience in related role
• Strong willingness to learn and adapt to new technologies
• Excellent communication and teamwork skills
• Basic understanding of relevant tools and technologies
• Problem-solving mindset and attention to detail

What We Offer:
• Competitive salary and comprehensive benefits package
• Structured mentorship and professional development programs
• Collaborative, inclusive, and supportive work environment
• Flexible work arrangements and work-life balance
• Clear career progression and growth opportunities`,

        'mid-level': `We are looking for an experienced ${jobTitle} to join our growing team.

Key Responsibilities:
• Lead and execute projects independently with minimal supervision
• Mentor and guide junior team members in their professional development
• Collaborate with stakeholders to gather and analyze requirements
• Design, implement, and maintain robust solutions following best practices
• Contribute to process improvements and team efficiency initiatives
• Participate in technical decision-making and architectural discussions

Requirements:
• Bachelor's degree in relevant field or equivalent experience
• 3-5 years of proven experience in similar role
• Demonstrated track record of successful project delivery
• Strong technical skills and deep domain knowledge
• Excellent communication and leadership abilities
• Experience working in collaborative, agile environments

What We Offer:
• Competitive salary and comprehensive benefits package
• Opportunities to lead projects and mentor team members
• Professional development budget and learning opportunities
• Flexible work arrangements and modern work environment
• Clear path for senior-level advancement`,

        senior: `We seek a highly experienced Senior ${jobTitle} to join our leadership team.

Key Responsibilities:
• Lead complex, high-impact projects and strategic initiatives
• Architect and design scalable, maintainable solutions
• Mentor team members and drive technical excellence across projects
• Collaborate with executive leadership on technical strategy and roadmap
• Drive innovation, process improvements, and organizational best practices
• Represent the company at industry events and technical conferences

Requirements:
• Bachelor's/Master's degree in relevant field or equivalent experience
• 5+ years of progressive experience with proven leadership track record
• Deep technical expertise and thought leadership in relevant domain
• Exceptional communication, strategic thinking, and decision-making skills
• Experience leading cross-functional teams and managing stakeholders
• Track record of driving organizational change and technical transformation

What We Offer:
• Highly competitive compensation package with equity participation
• Leadership development opportunities and executive coaching
• Flexible work arrangements and premium benefits
• Opportunity to shape technical direction and company culture
• Conference speaking opportunities and professional recognition`
      };
      
      const generatedJD = templates[seniority] || templates.junior;
      form.setValue('jobDescription', generatedJD);
      setHasGeneratedJD(true);
    } catch (error) {
      console.error('Error generating job description:', error);
    }
    
    setIsGeneratingJD(false);
  };

  const onSubmit = (data: JobWorkData) => {
    onNext(data);
  };

  const jobTitle = form.watch('jobTitle');
  const canGenerateJD = jobTitle && jobTitle.length > 2;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Job & Work Details</h3>
        <p className="text-sm text-muted-foreground">
          Define the role specifications. Use AI to generate a comprehensive job description.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Job Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Software Engineer" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seniority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seniority Level *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select seniority level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {seniorityLevels.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-11 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick start date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Location *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select work location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workLocationOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* AI Job Description Section */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI-Powered Job Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a comprehensive job description based on the role and seniority level.
              </p>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={generateJobDescription}
                  disabled={isGeneratingJD || !canGenerateJD}
                  className="flex items-center gap-2"
                >
                  {isGeneratingJD ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {hasGeneratedJD ? 'Regenerate JD' : 'Generate Job Description'}
                    </>
                  )}
                </Button>
                
                {!canGenerateJD && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    Enter a job title to enable AI generation
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job Description Field */}
          <FormField
            control={form.control}
            name="jobDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Description *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the role, responsibilities, requirements, and what you offer..." 
                    className="min-h-[200px] resize-y"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Back: Personal Info
            </Button>
            <Button type="submit" className="flex-1">
              Next: Compensation & Agreement
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}