import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const employeeId = formData.get('employeeId') as string;
    const documentType = formData.get('documentType') as string;

    if (!file || !employeeId || !documentType) {
      throw new Error('Missing required fields: file, employeeId, or documentType');
    }

    // Verify user has access to this employee
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, organization_id')
      .eq('id', employeeId)
      .single();

    if (employeeError || !employee) {
      throw new Error('Employee not found');
    }

    // Check if user has access to this organization
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', employee.organization_id)
      .single();

    if (roleError || !userRole) {
      throw new Error('Access denied to this employee');
    }

    // Generate file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${employeeId}/${documentType}_${Date.now()}.${fileExt}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employee-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('employee-documents')
      .getPublicUrl(fileName);

    // Update employee record with document URL
    const updateData: any = {
      documents_uploaded_at: new Date().toISOString(),
      documents_verification_status: 'pending'
    };

    switch (documentType) {
      case 'pan_card':
        updateData.pan_card_url = publicUrl;
        break;
      case 'previous_payslips':
        updateData.previous_payslips_url = publicUrl;
        break;
      case 'previous_offer_letter':
        updateData.previous_offer_letter_url = publicUrl;
        break;
      default:
        throw new Error('Invalid document type');
    }

    const { error: updateError } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', employeeId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update employee record: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document uploaded successfully',
        fileName,
        publicUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});