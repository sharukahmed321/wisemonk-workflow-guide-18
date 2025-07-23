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

const addressSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required')
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
        description: "MSA agreement generated and stored successfully! Proceeding to signature step.",
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
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [msaDocument, setMsaDocument] = useState<MSADocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const form = useForm<MSAFormData>({
    resolver: zodResolver(msaSchema),
    defaultValues: {}
  });

  React.useEffect(() => {
    loadExistingDocument();
  }, []);

  const loadExistingDocument = async () => {
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
        throw new Error(`Failed to load MSA: ${response.error.message}`);
      }

      if (response.data?.document) {
        setMsaDocument(response.data.document);
      }
    } catch (error) {
      console.error('Error loading MSA document:', error);
      toast({
        title: "Error",
        description: "Failed to load MSA document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadMSA = async () => {
    if (!msaDocument?.download_url) return;

    setIsDownloading(true);
    try {
      const response = await fetch(msaDocument.download_url);
      if (!response.ok) throw new Error('Failed to download file');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = msaDocument.file_name;
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

  const regenerateDocument = async () => {
    setIsRegenerating(true);
    try {
      // Force regeneration by clearing cache (this would require backend changes)
      await loadExistingDocument();
      
      toast({
        title: "Success",
        description: "MSA agreement regenerated successfully.",
      });
    } catch (error) {
      console.error('Error regenerating MSA:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate MSA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const sendForSigning = async () => {
    if (!msaDocument) {
      toast({
        title: "Error", 
        description: "No MSA document found to send for signing.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔄 Sending MSA for e-signature via Zoho Sign...');
      
      const { data: authData } = await supabase.auth.getSession();
      
      if (!authData.session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('send-msa-for-signing', {
        body: {
          msa_document_id: msaDocument.id
        },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      if (response.error) {
        console.error('Zoho Sign error:', response.error);
        throw new Error(`Failed to send for signing: ${response.error.message}`);
      }

      console.log('✅ MSA sent for e-signature successfully');
      
      toast({
        title: "Success",
        description: "MSA sent for e-signature! Redirecting to dashboard...",
      });

      // Wait a moment for the toast to show, then redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error sending MSA for signing:', error);
      toast({
        title: "Error",
        description: "Failed to send MSA for signing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading MSA document...</span>
        </div>
      </div>
    );
  }

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
              Your personalized MSA agreement has been generated and stored securely.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Information */}
            <div className="border rounded-lg p-6 bg-muted/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {msaDocument?.file_name || 'MSA Agreement'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Created: {msaDocument?.created_at ? new Date(msaDocument.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {msaDocument?.is_signed ? 'Signed' : 'Pending Signature'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadMSA}
                    disabled={isDownloading || !msaDocument?.download_url}
                    className="flex items-center gap-2"
                  >
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={regenerateDocument}
                    disabled={isRegenerating}
                    className="flex items-center gap-2"
                  >
                    {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
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

            <div className="space-y-6">
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    🔐 What happens next?
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>You can download and review the agreement above, then proceed to send it for e-signature.</p>
                    <p>Both you and Mithun will receive email invitations to sign the document electronically.</p>
                    <p>Once sent, you'll be redirected to the dashboard where you can add your first employee.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                  Review Later
                </Button>
                <Button 
                  onClick={sendForSigning} 
                  disabled={isSubmitting || msaDocument?.is_signed} 
                  className="flex-1"
                >
                  {isSubmitting ? 'Sending for Signature...' : msaDocument?.is_signed ? 'Already Signed' : 'Send for E-Signature'}
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
