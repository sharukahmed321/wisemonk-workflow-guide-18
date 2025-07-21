import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ExternalLink, CheckCircle, FileText, Download } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const addressSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required')
});

const msaSchema = z.object({});

type AddressFormData = z.infer<typeof addressSchema>;
type MSAFormData = z.infer<typeof msaSchema>;

interface AddressStepProps {
  onComplete: () => void;
}

export function AddressStep({ onComplete }: AddressStepProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address: '',
      city: '',
      state: '',
      postalCode: ''
    }
  });

  const onSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true);

    try {
      // Get the user's current profile to find organization_id
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.user?.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found for user');
      }

      // Update the organization with address information
      const { error } = await supabase.rpc('upsert_organization', {
        p_organization_id: profile.organization_id,
        p_business_address: data.address,
        p_business_city: data.city,
        p_business_state: data.state,
        p_business_postal_code: data.postalCode,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Business address saved successfully. Generating MSA agreement...",
      });

      // Generate MSA agreement after address is saved
      console.log('🔄 Generating MSA agreement...');
      const { data: authData } = await supabase.auth.getSession();
      
      if (!authData.session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('generate-msa-agreement', {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      if (response.error) {
        console.error('MSA generation error:', response.error);
        throw new Error(`Failed to generate MSA: ${response.error.message}`);
      }

      console.log('✅ MSA agreement generated successfully');
      
      toast({
        title: "Success",
        description: "MSA agreement generated successfully! Proceeding to signature step.",
      });

      // Navigate to MSA step for signing
      navigate('/dashboard/setup/msa');
    } catch (error) {
      console.error('Error saving address or generating MSA:', error);
      toast({
        title: "Error",
        description: "Failed to save address or generate MSA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-foreground">
              Business Address Details
            </CardTitle>
            <p className="text-muted-foreground">
              Please provide your company's official business address information.
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Business Street, Suite 100" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" className="h-11" {...field} />
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
                        <FormLabel>State/Province *</FormLabel>
                        <FormControl>
                          <Input placeholder="NY" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> This address will be used for legal documents, 
                    contracts, and official communications. Make sure it's accurate and up to date.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                    Save for Later
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Generating Agreement...' : 'Continue & Generate MSA'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MSAStepProps {
  onComplete: () => void;
}

export function MSAStep({ onComplete }: MSAStepProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<MSAFormData>({
    resolver: zodResolver(msaSchema),
    defaultValues: {}
  });

  const downloadMSA = async () => {
    setIsDownloading(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      
      if (!authData.session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('generate-msa-agreement', {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(`Failed to generate MSA: ${response.error.message}`);
      }

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MSA_Agreement_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "MSA agreement downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading MSA:', error);
      toast({
        title: "Error",
        description: "Failed to download MSA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const onSubmit = async (data: MSAFormData) => {
    setIsSubmitting(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user?.id)
        .single();

      const signedBy = profile 
        ? `${profile.first_name} ${profile.last_name}`.trim() 
        : 'Unknown User';

      const { error } = await supabase
        .from('profiles')
        .update({
          msa_signed: true,
          msa_signed_at: new Date().toISOString(),
          msa_signed_by: signedBy,
        })
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Master Service Agreement signed successfully.",
      });

      // Navigate back to dashboard instead of calling onComplete
      navigate('/dashboard');
    } catch (error) {
      console.error('Error signing MSA:', error);
      toast({
        title: "Error",
        description: "Failed to sign the agreement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Master Service Agreement
            </CardTitle>
            <p className="text-muted-foreground">
              Your personalized MSA agreement has been generated and is ready for review.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Preview */}
            <div className="border rounded-lg p-6 bg-muted/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">
                  Wisemonk Master Service Agreement
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadMSA}
                  disabled={isDownloading}
                  className="flex items-center gap-2"
                >
                  {isDownloading ? 'Generating...' : 'Download PDF'}
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  <strong>Summary:</strong> This Master Service Agreement has been personalized with your company and personal information.
                </p>
                
                <div className="space-y-2">
                  <p><strong>Key Terms:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Service availability and support commitments</li>
                    <li>Data protection and privacy guarantees</li>
                    <li>Billing terms and cancellation policy</li>
                    <li>Limitation of liability and dispute resolution</li>
                  </ul>
                </div>
                
                <p>
                  By accepting this agreement, you confirm that you have read, understood, 
                  and agree to be bound by all terms and conditions.
                </p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      🔐 What happens next?
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>You can download and review the agreement above, then proceed to sign it electronically.</p>
                      <p>This is legally binding and a copy will be saved for your records.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                    Review Later
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Processing...' : 'Accept & Sign Agreement'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface SetupCompleteProps {
  onContinue: () => void;
}

export function SetupComplete({ onContinue }: SetupCompleteProps) {
  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Setup Complete!
            </h2>
            <p className="text-muted-foreground">
              Congratulations! Your business setup is now complete. 
              You can now access all Wisemonk features.
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Business address verified</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Master Service Agreement signed</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Account fully activated</span>
            </div>
          </div>

          <Button onClick={onContinue} className="w-full">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
