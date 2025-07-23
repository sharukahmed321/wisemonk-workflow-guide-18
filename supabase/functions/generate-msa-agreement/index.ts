
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { generateAgreementPDF } from './pdf-generator.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

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
    console.log('🚀 Starting MSA generation request...');
    
    // Environment validation first
    const envValidation = validateAndCorrectEnvironmentVariables();
    if (!envValidation.valid) {
      console.error('❌ Environment validation failed:', envValidation.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Environment configuration error',
          details: envValidation.issues.join('; '),
          debug: envValidation.debugInfo
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ Authorization header missing');
      throw new Error('Authorization header missing');
    }

    // Get user from JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('❌ Invalid authentication:', userError);
      throw new Error('Invalid authentication');
    }

    console.log('✅ User authenticated:', user.id);

    // Fetch user profile and organization data
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
      console.error('❌ Failed to fetch user profile data:', profileError);
      throw new Error('Failed to fetch user profile data');
    }

    if (!profileData.organizations) {
      console.error('❌ No organization found for user');
      throw new Error('No organization found for user');
    }

    const organization = profileData.organizations;
    console.log('✅ User profile and organization loaded');

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
      console.log('✅ Recent MSA document found, returning existing');
      const { data: signedUrl } = await supabase.storage
        .from('msa-agreements')
        .createSignedUrl(existingDoc.file_path, 60 * 60);

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

    console.log('📋 MSA data prepared for generation');

    // Generate the MSA agreement PDF
    console.log('🔄 Starting PDF generation...');
    const pdfBuffer = await generateAgreementPDF(msaData);
    console.log('✅ PDF generation completed, size:', pdfBuffer.byteLength);

    // Create file name and path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `MSA_${organization.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;
    const filePath = `${profileData.organization_id}/${user.id}/${fileName}`;

    // Upload to Supabase storage
    console.log('📤 Uploading to Supabase storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('msa-agreements')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.warn('⚠️ Storage upload failed, falling back to direct download:', uploadError);
      // Fallback to direct download if storage fails
      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    console.log('✅ File uploaded to storage');

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
        generation_method: 'enhanced_shared_drive_workflow',
        document_version: 1,
        is_signed: false,
        metadata: msaData
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insertion error:', dbError);
    } else {
      console.log('✅ Database record created');
    }

    // Get signed URL for download
    const { data: signedUrl } = await supabase.storage
      .from('msa-agreements')
      .createSignedUrl(filePath, 60 * 60);

    console.log('✅ MSA generation completed successfully');

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
        generation_method: 'enhanced_shared_drive_workflow'
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('❌ Error in generate-msa-agreement function:', error);
    
    let errorMessage = error.message;
    let errorDetails = 'Failed to generate MSA agreement.';
    
    if (error.message.includes('File not found')) {
      errorDetails = 'Template document not found. Please check the DEFAULT_GOOGLE_DOC_ID configuration.';
    } else if (error.message.includes('access denied') || error.message.includes('permission')) {
      errorDetails = 'Access denied to Google Drive resources. Please check service account permissions.';
    } else if (error.message.includes('Rate limited')) {
      errorDetails = 'Google API rate limit exceeded. Please try again in a few moments.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        debug: {
          timestamp: new Date().toISOString(),
          errorStack: error.stack
        }
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
