import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ExternalLink, CheckCircle, FileText, Download, RefreshCw } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  createAddressValidator, 
  createCityValidator, 
  createStateValidator, 
  createPostalCodeValidator 
} from '@/lib/validationUtils';

const addressSchema = z.object({
  address: createAddressValidator('Street address'),
  city: createCityValidator(),
  state: createStateValidator(),
  postalCode: z.string()
    .min(1, 'Postal code is required')
    .refine(val => val.trim().length > 0, 'Postal code cannot be only whitespace')
    .transform(val => val.trim())
    .refine(val => /^\d+$/.test(val), 'Postal code must contain only numbers')
    .refine(val => val.length >= 3 && val.length <= 10, 'Postal code must be between 3-10 digits')
});

const msaSchema = z.object({});

type AddressFormData = z.infer<typeof addressSchema>;
type MSAFormData = z.infer<typeof msaSchema>;

interface MSADocument {
  id: string;
  file_name: string;
  file_path: string;
  download_url: string;
  created_at: string;
  is_signed: boolean;
  generation_method: string;
}

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
     /* console.log('🔄 Generating MSA agreement...');
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
        description: "MSA agreement generated and stored successfully! Proceeding to signature step.",
      });
*/
      // Navigate to dashboard
      navigate('/dashboard');
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
  const { toast } = useToast();
  
  const form = useForm<MSAFormData>({
    resolver: zodResolver(msaSchema),
    defaultValues: {}
  });

  const sendForSigning = async () => {
    setIsSubmitting(true);

    try {
      // First mark MSA as completed to trigger 75% progress
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            msa_completed: true,
            msa_status: 'completed'
          })
          .eq('user_id', user.user.id);
          
        if (updateError) {
          console.error('Error updating MSA completion status:', updateError);
        }
      }

      // Then redirect to dashboard immediately
      navigate('/dashboard');
      
      toast({
        title: "Processing",
        description: "MSA generation and e-signature process has started in the background.",
      });

      // Then run MSA generation and signing in background
      const { data: authData } = await supabase.auth.getSession();
      
      if (!authData.session) {
        throw new Error('No active session');
      }

      console.log('🔄 Generating MSA agreement...');

      // Generate MSA agreement first
      const msaResponse = await supabase.functions.invoke('generate-msa-agreement', {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      if (msaResponse.error) {
        console.error('MSA generation error:', msaResponse.error);
        throw new Error(`Failed to generate MSA: ${msaResponse.error.message}`);
      }

      console.log('✅ MSA agreement generated successfully');

      // Now send for signing
      if (msaResponse.data?.document) {
        console.log('🔄 Sending MSA for e-signature via Zoho Sign...');
        
        const signResponse = await supabase.functions.invoke('send-msa-for-signing', {
          body: {
            msa_document_id: msaResponse.data.document.id
          },
          headers: {
            Authorization: `Bearer ${authData.session.access_token}`,
          },
        });

        if (signResponse.error) {
          console.error('Zoho Sign error:', signResponse.error);
          throw new Error(`Failed to send for signing: ${signResponse.error.message}`);
        }

        console.log('✅ MSA sent for e-signature successfully');
      }

    } catch (error) {
      console.error('Error in MSA background process:', error);
      // Don't show error toast to user since they're already on dashboard
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
              Ready to generate and send your personalized MSA agreement for electronic signature.
            </p>
          </CardHeader>
          
          <div className="flex justify-end px-6 pb-4">
            <Button 
              variant="outline" 
              onClick={() => window.open('https://docs.google.com/document/d/19gpL98DSu_jvbU7Ol5NXU5AJPYG4SKEXKR_-_YElZ40/edit?tab=t.0', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View MSA Template
            </Button>
          </div>
          
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    🔐 What happens next?
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>When you click "Send for E-Signature", we'll automatically generate your personalized MSA agreement and send it for electronic signature.</p>
                    <p>Both you and Wisemonk will receive email invitations to sign the document electronically.</p>
                    <p>You'll be redirected to the dashboard immediately while the process completes in the background.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                  Review Later
                </Button>
                <Button 
                  onClick={sendForSigning} 
                  disabled={isSubmitting} 
                  className="flex-1"
                >
                  {isSubmitting ? 'Processing...' : 'Send for E-Signature'}
                </Button>
              </div>
            </div>
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
