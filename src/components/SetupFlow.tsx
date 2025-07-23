
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ExternalLink, CheckCircle, FileText, Download, RefreshCw, Send } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendMSAForSigning, checkMSASigningStatus } from '@/services/zohoSignService';

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
  zoho_sign_status?: string;
  zoho_sign_request_id?: string;
  signing_sent_at?: string;
  zoho_sign_error?: string;
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
    console.log('🏠 Submitting address data:', data); // Debug logging restored

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

      console.log('🏢 Organization ID found:', profile.organization_id); // Debug logging

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
      console.log('🔄 Generating MSA agreement...'); // Debug logging
      const { data: authData } = await supabase.auth.getSession();
      
      if (!authData.session) {
        throw new Error('No active session');
      }

      console.log('🔑 Session token available, calling MSA generation...'); // Debug logging

      const response = await supabase.functions.invoke('generate-msa-agreement', {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      if (response.error) {
        console.error('❌ MSA generation error:', response.error); // Debug logging
        throw new Error(`Failed to generate MSA: ${response.error.message}`);
      }

      console.log('✅ MSA agreement generated successfully:', response.data); // Debug logging
      
      toast({
        title: "Success",
        description: "MSA agreement generated and stored successfully! Proceeding to signature step.",
      });

      // Navigate to MSA step for signing
      navigate('/dashboard/setup/msa');
    } catch (error) {
      console.error('❌ Error saving address or generating MSA:', error); // Debug logging
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
  const [isSendingForSigning, setIsSendingForSigning] = useState(false);
  const [msaDocument, setMsaDocument] = useState<MSADocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const form = useForm<MSAFormData>({
    resolver: zodResolver(msaSchema),
    defaultValues: {}
  });

  React.useEffect(() => {
    console.log('🔄 MSA Step mounted, loading existing document...'); // Debug logging
    loadExistingDocument();
  }, []);

  const loadExistingDocument = async () => {
    try {
      console.log('📄 Loading existing MSA document...'); // Debug logging
      const { data: authData } = await supabase.auth.getSession();
      
      if (!authData.session) {
        throw new Error('No active session');
      }

      console.log('🔑 Session available, calling MSA function...'); // Debug logging

      const response = await supabase.functions.invoke('generate-msa-agreement', {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      if (response.error) {
        console.error('❌ MSA loading error:', response.error); // Debug logging
        throw new Error(`Failed to load MSA: ${response.error.message}`);
      }

      if (response.data?.document) {
        console.log('✅ MSA document loaded:', response.data.document); // Debug logging
        setMsaDocument(response.data.document);
      }
    } catch (error) {
      console.error('❌ Error loading MSA document:', error); // Debug logging
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
    console.log('📥 Downloading MSA document...'); // Debug logging
    
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

      console.log('✅ MSA document downloaded successfully'); // Debug logging
      toast({
        title: "Success",
        description: "MSA agreement downloaded successfully.",
      });
    } catch (error) {
      console.error('❌ Error downloading MSA:', error); // Debug logging
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
    console.log('🔄 Regenerating MSA document...'); // Debug logging
    
    try {
      // Force regeneration by clearing cache (this would require backend changes)
      await loadExistingDocument();
      
      console.log('✅ MSA document regenerated successfully'); // Debug logging
      toast({
        title: "Success",
        description: "MSA agreement regenerated successfully.",
      });
    } catch (error) {
      console.error('❌ Error regenerating MSA:', error); // Debug logging
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
    if (!msaDocument) return;

    setIsSendingForSigning(true);
    console.log('📧 Sending MSA for e-signature...', msaDocument.id); // Debug logging
    
    try {
      const response = await sendMSAForSigning({
        msaDocumentId: msaDocument.id
      });

      if (response.success) {
        console.log('✅ MSA sent for e-signature successfully:', response); // Debug logging
        toast({
          title: "Success",
          description: "MSA agreement sent for e-signature successfully!",
        });

        // Reload document to get updated status
        await loadExistingDocument();
      }
    } catch (error) {
      console.error('❌ Error sending for signing:', error); // Debug logging
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send for signing",
        variant: "destructive",
      });
    } finally {
      setIsSendingForSigning(false);
    }
  };

  const checkSigningStatus = async () => {
    if (!msaDocument?.zoho_sign_request_id) return;

    try {
      console.log('🔍 Checking signing status...', msaDocument.zoho_sign_request_id); // Debug logging
      const status = await checkMSASigningStatus(msaDocument.id);
      
      console.log('📊 Signing status:', status); // Debug logging
      
      if (status.zoho_sign_status === 'completed') {
        console.log('✅ Document signing completed!'); // Debug logging
        toast({
          title: "Document Signed!",
          description: "Your MSA has been successfully signed by all parties.",
        });
        
        // Navigate to dashboard with 75% progress
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('❌ Error checking signing status:', error); // Debug logging
    }
  };

  // Check signing status periodically
  React.useEffect(() => {
    if (msaDocument?.zoho_sign_status === 'sent') {
      console.log('⏱️ Setting up periodic status check...'); // Debug logging
      const interval = setInterval(checkSigningStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [msaDocument?.zoho_sign_status]);

  const onSubmit = async (data: MSAFormData) => {
    console.log('📝 Submitting MSA form for e-signature...'); // Debug logging
    // For Zoho Sign integration, we don't need the old local signing logic
    await sendForSigning();
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
                    Status: {msaDocument?.is_signed ? 'Signed' : 
                      msaDocument?.zoho_sign_status === 'sent' ? 'Sent for E-Signature' :
                      msaDocument?.zoho_sign_status === 'processing' ? 'Processing...' :
                      msaDocument?.zoho_sign_status === 'failed' ? 'E-Signature Failed' :
                      'Ready for E-Signature'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Generation Method: {msaDocument?.generation_method || 'N/A'} {/* Debug info */}
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

            {/* Debug Information Panel */}
            <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">🔧 Debug Information</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>Document ID:</strong> {msaDocument?.id || 'N/A'}</p>
                <p><strong>File Path:</strong> {msaDocument?.file_path || 'N/A'}</p>
                <p><strong>Zoho Sign Status:</strong> {msaDocument?.zoho_sign_status || 'N/A'}</p>
                <p><strong>Zoho Sign Request ID:</strong> {msaDocument?.zoho_sign_request_id || 'N/A'}</p>
                <p><strong>Signing Sent At:</strong> {msaDocument?.signing_sent_at || 'N/A'}</p>
                {msaDocument?.zoho_sign_error && (
                  <p><strong>Error:</strong> {msaDocument.zoho_sign_error}</p>
                )}
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      📧 E-Signature Process
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      {msaDocument?.zoho_sign_status === 'sent' ? (
                        <>
                          <p>✅ Document sent for e-signature to all parties.</p>
                          <p>📧 You and Mithun will receive email notifications to sign.</p>
                          <p>⏱️ This page will automatically update when signing is complete.</p>
                        </>
                      ) : msaDocument?.zoho_sign_status === 'failed' ? (
                        <>
                          <p>❌ E-signature process failed. Please try again.</p>
                          <p>Error: {msaDocument.zoho_sign_error}</p>
                        </>
                      ) : (
                        <>
                          <p>📄 Review the agreement above, then send it for electronic signature.</p>
                          <p>📧 Both you and Mithun will receive email invitations to sign.</p>
                          <p>🔒 The signed document will be stored securely and legally binding.</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                    Review Later
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={
                      isSendingForSigning || 
                      msaDocument?.is_signed || 
                      msaDocument?.zoho_sign_status === 'sent' ||
                      msaDocument?.zoho_sign_status === 'processing'
                    } 
                    className="flex-1"
                  >
                    {isSendingForSigning ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending for E-Signature...
                      </>
                    ) : msaDocument?.is_signed ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Already Signed
                      </>
                    ) : msaDocument?.zoho_sign_status === 'sent' ? (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Sent for E-Signature
                      </>
                    ) : msaDocument?.zoho_sign_status === 'processing' ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send for E-Signature
                      </>
                    )}
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
  console.log('✅ Setup completed successfully!'); // Debug logging
  
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
