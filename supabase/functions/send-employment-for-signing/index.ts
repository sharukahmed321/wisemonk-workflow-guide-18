import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Cache for access token
let cachedToken = null;

const getZohoAccessToken = async () => {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiry) {
    console.log('Using cached Zoho access token');
    return cachedToken.token;
  }

  console.log('Attempting to get Zoho access token');
  const clientId = Deno.env.get('ZOHO_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
  const refreshToken = Deno.env.get('ZOHO_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Zoho credentials in environment variables');
  }

  const params = new URLSearchParams();
  params.append('refresh_token', refreshToken);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'refresh_token');

  const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
    method: 'POST',
    body: params
  });

  console.log(`Token response status: ${response.status}`);
  
  if (response.status === 200) {
    const responseData = await response.json();
    if (responseData.access_token) {
      console.log("Successfully generated access token");
      // Cache the token (expires in 1 hour, cache for 55 minutes)
      cachedToken = {
        token: responseData.access_token,
        expiry: Date.now() + (55 * 60 * 1000)
      };
      return responseData.access_token;
    } else {
      console.log('Error: No access token in response: ' + JSON.stringify(responseData));
      throw new Error('No access token in response');
    }
  } else {
    const responseText = await response.text();
    console.log(`Token endpoint error: ${responseText}`);
    throw new Error(`Failed to get token: ${responseText}`);
  }
};

const createZohoSignRequest = async (accessToken, pdfUrl, fileName, employee, organization) => {
  console.log('Creating Zoho Sign request...');
  
  // Download the PDF from Supabase
  console.log('Downloading PDF from:', pdfUrl);
  const pdfResponse = await fetch(pdfUrl);
  if (!pdfResponse.ok) {
    throw new Error(`Failed to download PDF: ${pdfResponse.status} - ${pdfResponse.statusText}`);
  }

  const pdfBuffer = await pdfResponse.arrayBuffer();
  console.log(`PDF downloaded, size: ${pdfBuffer.byteLength} bytes`);

  // Check file size limit (25MB for Zoho Sign)
  if (pdfBuffer.byteLength > 25 * 1024 * 1024) {
    throw new Error(`PDF file too large: ${(pdfBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB. Zoho Sign limit is 25MB.`);
  }

  // Verify it's a PDF
  const pdfHeader = new Uint8Array(pdfBuffer.slice(0, 4));
  const headerText = new TextDecoder().decode(pdfHeader);
  if (headerText !== '%PDF') {
    throw new Error(`Invalid PDF file. Header: ${headerText}`);
  }

  console.log('PDF validation passed');

  // Prepare actions for signing
  const actions = [
    {
      action_type: "SIGN",
      recipient_email: "mithun@wisemonk.io",
      recipient_name: "Mithun",
      signing_order: 1,
      private_notes: "",
      verify_recipient: false
    },
    {
      action_type: "SIGN",
      recipient_email: employee.email,
      recipient_name: `${employee.first_name} ${employee.last_name}`.trim(),
      signing_order: 2,
      private_notes: "",
      verify_recipient: false
    },
    {
      action_type: "VIEW",
      recipient_email: employee.added_by_email,
      recipient_name: organization.name,
      signing_order: 3,
      private_notes: "",
      verify_recipient: false
    }
  ];

  // Prepare request data
  const requestData = {
    requests: {
      request_name: `${employee.first_name} ${employee.last_name}_${organization.name} - Employment Agreement`,
      actions: actions,
      expiration_days: 5,
      is_sequential: true,
      email_reminders: true,
      reminder_period: 4
    }
  };

  console.log('Request data prepared:', {
    request_name: requestData.requests.request_name,
    actions_count: requestData.requests.actions.length,
    recipient_emails: requestData.requests.actions.map(a => a.recipient_email),
    employee_id: employee.id
  });

  // Create multipart form data manually
  const boundary = `----WebKitFormBoundary${Math.random().toString(16).substr(2)}`;
  let bodyParts = [];

  // Add JSON data part
  const jsonPart = new TextEncoder().encode(
    `--${boundary}\r\n` +
    'Content-Disposition: form-data; name="data"\r\n' +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(requestData) + '\r\n'
  );
  bodyParts.push(jsonPart);

  // Add file part header
  const fileHeaderPart = new TextEncoder().encode(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    'Content-Type: application/pdf\r\n\r\n'
  );
  bodyParts.push(fileHeaderPart);

  // Add file buffer
  bodyParts.push(new Uint8Array(pdfBuffer));

  // Add end boundary
  const endPart = new TextEncoder().encode(`\r\n--${boundary}--\r\n`);
  bodyParts.push(endPart);

  // Combine all parts
  const totalLength = bodyParts.reduce((sum, part) => sum + part.length, 0);
  const requestBody = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of bodyParts) {
    requestBody.set(part, offset);
    offset += part.length;
  }

  console.log(`Multipart body created, total size: ${totalLength} bytes`);

  const response = await fetch('https://sign.zoho.in/api/v1/requests', {
    method: 'POST',
    headers: {
      'Authorization': 'Zoho-oauthtoken ' + accessToken,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': requestBody.length.toString()
    },
    body: requestBody
  });

  console.log(`Create document response status: ${response.status}`);
  
  if (response.status !== 200) {
    const responseText = await response.text();
    throw new Error(`Document request creation failed: ${responseText}`);
  }

  // Parse the response
  const createResponse = await response.json();
  
  // Extract and log request ID and document ID
  const requestId = createResponse.requests.request_id;
  const documentId = createResponse.requests.document_ids[0].document_id;
  
  console.log(`Extracted Request ID: ${requestId}`);
  console.log(`Extracted Document ID: ${documentId}`);
  
  return {
    requestId,
    documentId,
    domain: 'zoho.in'
  };
};

const submitDocumentForSignature = async (accessToken, requestId, documentId, employeeId) => {
  try {
    console.log(`Submitting request ${requestId} for signature with employee ID: ${employeeId}`);
    
    // Create text fields for the document on page 13
    const textFields = [
      {
        document_id: documentId,
        field_name: `TextField_Employee_${employeeId}`,
        field_type_name: "Textfield",
        field_label: `Employee ID`,
        field_category: "Textfield",
        default_value: employeeId,
        abs_width: "200",
        abs_height: "18",
        is_mandatory: true,
        x_coord: "30",
        y_coord: "700",
        page_no: 13
      }
    ];

    const payload = {
      requests: {
        actions: [
          {
            action_type: "SIGN",
            recipient_name: "Deepika",
            recipient_email: "deepika@wisemonk.co",
            signing_order: -1,
            fields: {
              text_fields: textFields
            }
          }
        ]
      }
    };

    const response = await fetch(`https://sign.zoho.in/api/v1/requests/${requestId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': 'Zoho-oauthtoken ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`Submit request response status: ${response.status}`);
    
    if (response.status !== 200) {
      const responseText = await response.text();
      throw new Error(`Failed to submit request: ${responseText}`);
    }

    const submitResponse = await response.json();
    console.log('Document submitted for signature successfully');
    return submitResponse;

  } catch (error) {
    console.error(`Error submitting document for signature: ${error.message}`);
    throw error;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let employeeId = null;

  try {
    console.log('=== Send Employment Agreement for Signing Function Started ===');
    
    // Parse and validate request body
    const requestBody = await req.json();
    
    if (!requestBody || typeof requestBody !== 'object') {
      console.error('❌ Invalid request body format');
      return new Response(JSON.stringify({
        error: 'Invalid request body format'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    employeeId = requestBody.employeeId;

    // Validate employee ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!employeeId || typeof employeeId !== 'string' || !uuidRegex.test(employeeId)) {
      console.error('❌ Invalid employee ID format:', employeeId);
      return new Response(JSON.stringify({
        error: 'Valid employee ID is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Request validation passed');
    console.log('Processing employee:', employeeId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch employee details with organization information
    console.log('Fetching employee details with organization...');
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select(`
        *,
        organizations!inner(
          id,
          name,
          legal_name,
          business_address,
          business_city,
          business_state,
          business_postal_code
        )
      `)
      .eq('id', employeeId)
      .single();

    if (fetchError || !employee) {
      console.error('Employee fetch error:', fetchError);
      return new Response(JSON.stringify({
        error: 'Employee not found',
        details: fetchError?.message
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Employee found:', {
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      email: employee.email,
      organization: employee.organizations.name,
      added_by_email: employee.added_by_email,
      has_agreement_url: !!employee.employment_agreement_url
    });

    // Check if employee has an employment agreement PDF
    if (!employee.employment_agreement_url) {
      return new Response(JSON.stringify({
        error: 'No employment agreement PDF available. Please generate the agreement first.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if we have the client email (who added the employee)
    if (!employee.added_by_email) {
      return new Response(JSON.stringify({
        error: 'Client email not found. Cannot send for signing without client information.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Employment agreement PDF found:', employee.employment_agreement_url);

    // Update status to indicate signing process has started
    console.log('Setting status to processing...');
    await supabase
      .from('employees')
      .update({
        signing_sent_at: new Date().toISOString(),
        zoho_sign_status: 'processing'
      })
      .eq('id', employeeId);

    // Get Zoho access token
    console.log('Getting Zoho access token...');
    const accessToken = await getZohoAccessToken();
    console.log('Access token obtained');

    // Create Zoho Sign request
    const fileName = `employment_agreement_${employee.first_name}_${employee.last_name}.pdf`;
    console.log('Creating Zoho Sign request with filename:', fileName);
    
    const { requestId, documentId } = await createZohoSignRequest(
      accessToken, 
      employee.employment_agreement_url, 
      fileName, 
      employee, 
      employee.organizations
    );

    console.log('Zoho Sign request created, now submitting for signature...');

    // Wait a moment for the document to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Submit document for signature with text fields
    await submitDocumentForSignature(accessToken, requestId, documentId, employeeId);

    // Update employee record with Zoho details
    console.log('Updating employee record with Zoho details...');
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        zoho_sign_request_id: requestId,
        zoho_sign_document_id: documentId,
        zoho_sign_status: 'sent',
        signing_sent_at: new Date().toISOString()
      })
      .eq('id', employeeId);

    if (updateError) {
      console.error('Failed to update employee record:', updateError);
      throw new Error('Failed to update employee record after sending for signing');
    }

    console.log('=== ✅ Employment Agreement sent for signing successfully ===');

    return new Response(JSON.stringify({
      success: true,
      message: `Employment agreement sent for signing to ${employee.first_name} ${employee.last_name}`,
      employee_id: employeeId,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      organization_name: employee.organizations.name,
      client_email: employee.added_by_email,
      zoho_sign: {
        request_id: requestId,
        document_id: documentId,
        status: 'sent'
      },
      sent_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('=== ❌ Error in send-employment-for-signing function ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Try to update employee record with error (only if we have employeeId)
    if (employeeId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          await supabase
            .from('employees')
            .update({
              zoho_sign_status: 'failed',
              zoho_sign_error: error.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', employeeId);
          console.log('✅ Updated employee record with error status');
        }
      } catch (updateError) {
        console.error('❌ Failed to update error status:', updateError.message);
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      employee_id: employeeId,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});