
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { generateAgreementPDF } from './pdf-generator.ts';
import { quickSetupCheck, verifyBothIDs } from './setup-verification.ts';
import { getGoogleAccessToken } from './google-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '', 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
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

    console.log('🔄 Generating Employment Agreement for user:', user.id);

    // Fetch employee data and organization details
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select(`
        *,
        organizations (
          id,
          name,
          legal_name,
          business_address,
          business_city,
          business_state,
          business_postal_code,
          country,
          phone,
          website
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (employeeError || !employeeData) {
      console.error('❌ Error fetching employee data:', employeeError);
      throw new Error('Failed to fetch employee data. Please ensure you have an employee record.');
    }

    if (!employeeData.organizations) {
      throw new Error('No organization found for employee');
    }

    const organization = employeeData.organizations;
    console.log('✅ Fetched employee data for:', employeeData.first_name, employeeData.last_name);
    console.log('✅ Organization:', organization.name);

    // Prepare comprehensive employment data for placeholder replacement
    const employmentData = {
      // Employee data
      id: employeeData.id,
      employee_id: employeeData.employee_id,
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
      full_name: employeeData.full_name || `${employeeData.first_name} ${employeeData.last_name}`,
      email: employeeData.email,
      phone: employeeData.phone,
      job_title: employeeData.job_title,
      job_description: employeeData.job_description,
      department: employeeData.department,
      employment_type: employeeData.employment_type,
      manager_details: employeeData.manager_details || '',
      work_location: employeeData.work_location,
      
      // Salary data
      annual_gross_salary: employeeData.annual_gross_salary,
      annual_basic: employeeData.annual_basic,
      annual_hra: employeeData.annual_hra,
      annual_lta: employeeData.annual_lta,
      annual_special_allowance: employeeData.annual_special_allowance,
      yfbp: employeeData.yfbp,
      monthly_gross: employeeData.monthly_gross,
      monthly_basic: employeeData.monthly_basic,
      monthly_hra: employeeData.monthly_hra,
      monthly_lta: employeeData.monthly_lta,
      monthly_special_allowance: employeeData.monthly_special_allowance,
      mfbp: employeeData.mfbp,
      bonus: employeeData.bonus || 0,
      
      // Date fields
      start_date: employeeData.start_date,
      joining_date: employeeData.start_date, // Use start_date as joining_date
      last_date: employeeData.last_date,
      agreement_date: employeeData.agreement_date,
      
      // Personal details
      date_of_birth: employeeData.date_of_birth,
      age: employeeData.age,
      gender: employeeData.gender,
      father_name: employeeData.father_name,
      aadhaar_number: employeeData.aadhaar_number,
      
      // Address
      address_line_1: employeeData.address_line_1,
      address_line_2: employeeData.address_line_2,
      city: employeeData.city,
      state: employeeData.state,
      pincode: employeeData.pincode,
      
      // Organization data
      name: organization.name,
      legal_name: organization.legal_name,
      business_address: organization.business_address,
      business_city: organization.business_city,
      business_state: organization.business_state,
      business_postal_code: organization.business_postal_code,
      company_phone: organization.phone,
      company_website: organization.website,
      country: organization.country,
      
      // System fields
      currentDate: new Date().toISOString(),
      organization_id: employeeData.organization_id,
    };

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
    
    console.log('✅ All verifications passed, proceeding with Employment Agreement generation...');
    console.log('🔄 Generating PDF with verified Shared Drive workflow...');

    // Get template document ID from secrets (already verified)
    const templateDocId = Deno.env.get('DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID') || Deno.env.get('DEFAULT_GOOGLE_DOC_ID');

    // Generate the Employment Agreement PDF using verified workflow
    const pdfBuffer = await generateAgreementPDF(employmentData, templateDocId);
    console.log('✅ Employment Agreement PDF generated successfully, size:', pdfBuffer.byteLength);

    // Create file name and path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Employment_Agreement_${organization.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;
    const filePath = `${employeeData.organization_id}/${user.id}/${fileName}`;

    // Upload to Supabase storage
    console.log('📤 Uploading PDF to storage bucket...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employment-agreements')
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
        }
      });
    }

    console.log('✅ PDF uploaded to storage:', uploadData.path);

    // Determine generation method
    const generationMethod = 'verified_shared_drive_workflow';

    // Create database record
    const { data: documentRecord, error: dbError } = await supabase
      .from('employment_agreements')
      .insert({
        user_id: user.id,
        organization_id: employeeData.organization_id,
        document_type: 'employment_agreement',
        file_name: fileName,
        file_path: filePath,
        file_size: pdfBuffer.byteLength,
        mime_type: 'application/pdf',
        generation_method: generationMethod,
        document_version: 1,
        is_signed: false,
        metadata: employmentData
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
      .from('employment-agreements')
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
    console.error('💥 Error in generate-employment-agreement function:', error);
    
    // Enhanced error messages for common configuration issues
    let errorMessage = error.message;
    let errorDetails = 'Failed to generate Employment Agreement due to configuration issues.';
    
    if (error.message.includes('Configuration issues detected')) {
      errorDetails = 'Setup verification failed. Please check your environment configuration and ensure all required secrets are properly set.';
    } else if (error.message.includes('Template document issue')) {
      errorDetails = 'The configured template document cannot be accessed. Please verify the DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID or DEFAULT_GOOGLE_DOC_ID is correct and the service account has proper permissions.';
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
