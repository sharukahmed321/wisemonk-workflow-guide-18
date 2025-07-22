
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { generateAgreementPDF } from './pdf-generator.ts';
import { quickSetupCheck, verifyBothIDs } from './setup-verification.ts';
import { getGoogleAccessToken } from './google-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Get user from JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log('🔄 Generating MSA agreement for user:', user.id);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        first_name,
        last_name,
        job_title,
        organization_id,
        organizations (
          id,
          name,
          legal_name,
          business_address,
          business_city,
          business_state,
          business_postal_code
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profileData) {
      console.error('❌ Error fetching profile data:', profileError);
      throw new Error('Failed to fetch user profile data');
    }

    if (!profileData.organizations) {
      throw new Error('No organization found for user');
    }

    const organization = profileData.organizations;
    console.log('✅ Fetched user data for:', profileData.first_name, profileData.last_name);
    console.log('✅ Organization:', organization.name);

    // STEP 1: Quick setup verification (fast checks without API calls)
    console.log('🔍 Running complete setup verification...');
    const setupCheck = quickSetupCheck();
    
    if (!setupCheck.valid) {
      const errorMessage = `Configuration issues detected: ${setupCheck.issues.join('; ')}`;
      const recommendations = `Recommendations: ${setupCheck.recommendations.join('; ')}`;
      console.error('❌ Setup verification failed:', errorMessage);
      console.error('💡', recommendations);
      throw new Error(`${errorMessage}. ${recommendations}`);
    }

    // STEP 2: API verification (actual access checks)
    const accessToken = await getGoogleAccessToken();
    const verificationResult = await verifyBothIDs(accessToken);
    console.log('📊 Verification Results:', JSON.stringify(verificationResult, null, 2));

    if (!verificationResult.templateDoc.accessible) {
      throw new Error(`Template document issue: ${verificationResult.templateDoc.error}`);
    }

    if (!verificationResult.sharedDrive.accessible) {
      throw new Error(`Shared Drive issue: ${verificationResult.sharedDrive.error}`);
    }

    console.log('✅ All verifications passed, proceeding with MSA generation...');

    // Check if a recent MSA document already exists (within last 24 hours)
    const { data: existingDoc } = await supabase
      .from('msa_documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', profileData.organization_id)
      .eq('document_type', 'msa_agreement')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If document exists and is recent, return it
    if (existingDoc && new Date(existingDoc.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      console.log('📄 Returning existing recent document:', existingDoc.file_name);
      
      // Get signed URL for download
      const { data: signedUrl } = await supabase.storage
        .from('msa-agreements')
        .createSignedUrl(existingDoc.file_path, 60 * 60); // 1 hour expiry

      return new Response(JSON.stringify({
        success: true,
        document: {
          id: existingDoc.id,
          file_name: existingDoc.file_name,
          file_path: existingDoc.file_path,
          download_url: signedUrl?.signedUrl,
          created_at: existingDoc.created_at,
          is_signed: existingDoc.is_signed,
          generation_method: existingDoc.generation_method
        }
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // Prepare MSA data for placeholder replacement
    const msaData = {
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      job_title: profileData.job_title,
      name: organization.name,
      legal_name: organization.legal_name,
      business_address: organization.business_address,
      business_city: organization.business_city,
      business_state: organization.business_state,
      business_postal_code: organization.business_postal_code,
      currentDate: new Date().toISOString(),
    };

    console.log('🔄 Generating PDF with verified Shared Drive workflow...');
    
    // Get template document ID from secrets (already verified)
    const templateDocId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID');
    
    // Generate the MSA agreement PDF using verified workflow
    const pdfBuffer = await generateAgreementPDF(msaData, templateDocId);
    
    console.log('✅ MSA agreement PDF generated successfully, size:', pdfBuffer.byteLength);

    // Create file name and path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `MSA_${organization.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;
    const filePath = `${profileData.organization_id}/${user.id}/${fileName}`;

    // Upload to Supabase storage
    console.log('📤 Uploading PDF to storage bucket...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('msa-agreements')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      // Fallback to direct download if storage fails
      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    console.log('✅ PDF uploaded to storage:', uploadData.path);

    // Determine generation method
    const generationMethod = 'verified_shared_drive_workflow';

    // Create database record
    const { data: documentRecord, error: dbError } = await supabase
      .from('msa_documents')
      .insert({
        user_id: user.id,
        organization_id: profileData.organization_id,
        document_type: 'msa_agreement',
        file_name: fileName,
        file_path: filePath,
        file_size: pdfBuffer.byteLength,
        mime_type: 'application/pdf',
        generation_method: generationMethod,
        document_version: 1,
        is_signed: false,
        metadata: msaData
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insertion error:', dbError);
      // Continue anyway - storage upload was successful
    }

    console.log('✅ Database record created:', documentRecord?.id);

    // Get signed URL for download
    const { data: signedUrl } = await supabase.storage
      .from('msa-agreements')
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

    // Return document metadata and download URL
    return new Response(JSON.stringify({
      success: true,
      document: {
        id: documentRecord?.id,
        file_name: fileName,
        file_path: filePath,
        download_url: signedUrl?.signedUrl,
        created_at: documentRecord?.created_at,
        is_signed: false,
        generation_method: generationMethod
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('💥 Error in generate-msa-agreement function:', error);
    
    // Enhanced error messages for common configuration issues
    let errorMessage = error.message;
    let errorDetails = 'Failed to generate MSA agreement due to configuration issues.';
    
    if (error.message.includes('Configuration issues detected')) {
      errorDetails = 'Setup verification failed. Please check your environment configuration and ensure all required secrets are properly set.';
    } else if (error.message.includes('Template document issue')) {
      errorDetails = 'The configured template document cannot be accessed. Please verify the DEFAULT_GOOGLE_DOC_ID is correct and the service account has proper permissions.';
    } else if (error.message.includes('Shared Drive issue')) {
      errorDetails = 'The configured Shared Drive cannot be accessed. Please verify the GOOGLE_SHARED_DRIVE_ID is correct and the service account has Editor permissions on the Shared Drive.';
    } else if (error.message.includes('access denied') || error.message.includes('permission')) {
      errorDetails = 'Access denied to Google Drive resources. Please check that the service account has proper permissions.';
    } else if (error.message.includes('Rate limited')) {
      errorDetails = 'Google API rate limit exceeded. Please try again in a few moments.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
