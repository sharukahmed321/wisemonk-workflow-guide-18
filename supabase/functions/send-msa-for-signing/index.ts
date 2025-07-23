import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Cache for access token
let cachedToken: { token: string; expiry: number } | null = null;

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

  console.log('Using credentials - Client ID length:', clientId.length, 'Refresh token length:', refreshToken.length);

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
        expiry: Date.now() + 55 * 60 * 1000
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

const createZohoSignRequest = async (accessToken: string, pdfUrl: string, fileName: string, userProfile: any, organization: any) => {
  console.log('Creating Zoho Sign request...');
  
  // Download the PDF from Supabase
  console.log('Downloading PDF from:', pdfUrl);
  const pdfResponse = await fetch(pdfUrl);
  if (!pdfResponse.ok) {
    throw new Error(`Failed to download PDF: ${pdfResponse.status} - ${pdfResponse.statusText}`);
  }

  const pdfBuffer = await pdfResponse.arrayBuffer();
  console.log(`PDF downloaded, size: ${pdfBuffer.byteLength} bytes (${(pdfBuffer.byteLength / (1024 * 1024)).toFixed(2)} MB)`);

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

  // Prepare actions for signing - Mithun (signer 1), Client (signer 2)
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
      recipient_email: userProfile.email,
      recipient_name: `${userProfile.first_name} ${userProfile.last_name}`.trim(),
      signing_order: 2,
      private_notes: "",
      verify_recipient: false
    }
  ];

  // Prepare request data
  const requestData = {
    requests: {
      request_name: `MSA - ${organization?.name || 'Client'} - ${userProfile.first_name} ${userProfile.last_name}`,
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
    user_id_for_text_field: userProfile.user_id
  });

  // Create multipart form data manually
  const boundary = `----WebKitFormBoundary${Math.random().toString(16).substr(2)}`;
  let bodyParts = [];

  // Add JSON data part
  const jsonPart = new TextEncoder().encode(
    `--${boundary}\r\n` +
    'Content-Disposition: form-data; name="data"\r\n' +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(requestData) +
    '\r\n'
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

const submitDocumentForSignature = async (accessToken: string, requestId: string, documentId: string, userProfile: any) => {
  try {
    console.log(`Submitting request ${requestId} for signature with MSA document ID: ${userProfile.user_id}`);

    // Create text fields for the document
    const textFields = [
      {
        document_id: documentId,
        field_name: `TextField_MSA_${userProfile.user_id}`,
        field_type_name: "Textfield",
        field_label: `MSA Document ID`,
        field_category: "Textfield",
        default_value: userProfile.user_id,
        abs_width: "200",
        abs_height: "18",
        is_mandatory: true,
        x_coord: "30",
        y_coord: "700",
        page_no: 8
      }
    ];

    const payload = {
      requests: {
        actions: [
          {
            action_type: "SIGN",
            recipient_name: "Mithun",
            recipient_email: "mithun@wisemonk.io",
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

  let msaDocumentId: string | null = null;
  
  try {
    console.log('=== Send for Signing Function Started ===');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const requestBody = await req.json();
    msaDocumentId = requestBody.msa_document_id;

    if (!msaDocumentId) {
      throw new Error('MSA document ID is required');
    }

    console.log('Processing MSA document ID:', msaDocumentId);

    // Get MSA document details
    const { data: msaDoc, error: msaError } = await supabase
      .from('msa_documents')
      .select('*')
      .eq('id', msaDocumentId)
      .single();

    if (msaError || !msaDoc) {
      console.error('MSA document fetch error:', msaError);
      throw new Error('MSA document not found');
    }

    console.log('MSA document found:', {
      id: msaDoc.id,
      file_path: msaDoc.file_path,
      user_id: msaDoc.user_id,
      is_signed: msaDoc.is_signed
    });

    // Get user profile and organization details
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations (*)
      `)
      .eq('user_id', msaDoc.user_id)
      .single();

    if (profileError || !userProfile) {
      console.error('User profile fetch error:', profileError);
      throw new Error('User profile not found');
    }

    console.log('User profile found:', {
      user_name: `${userProfile.first_name} ${userProfile.last_name}`,
      user_email: userProfile.email,
      organization: userProfile.organizations?.name
    });

    // Construct full PDF URL
    const pdfUrl = `${supabaseUrl}/storage/v1/object/public/msa-agreements/${msaDoc.file_path}`;
    console.log('PDF URL constructed');

    // Update status to indicate signing process has started
    await supabase
      .from('msa_documents')
      .update({
        signing_sent_at: new Date().toISOString(),
        zoho_sign_status: 'processing'
      })
      .eq('id', msaDocumentId);

    // Get Zoho access token
    console.log('Getting Zoho access token...');
    const accessToken = await getZohoAccessToken();
    console.log('Access token obtained');

    // Create Zoho Sign request
    const fileName = `msa_agreement_${userProfile.first_name}_${userProfile.last_name}.pdf`;
    console.log('Creating Zoho Sign request with filename:', fileName);
    
    const { requestId, documentId } = await createZohoSignRequest(
      accessToken, 
      pdfUrl, 
      fileName, 
      userProfile, 
      userProfile.organizations
    );

    console.log('Zoho Sign request created, now submitting for signature...');

    // Wait a moment for the document to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Submit document for signature with text fields
    await submitDocumentForSignature(accessToken, requestId, documentId, userProfile);

    // Update MSA document record with Zoho details
    const { error: updateError } = await supabase
      .from('msa_documents')
      .update({
        zoho_sign_request_id: requestId,
        zoho_sign_document_id: documentId,
        zoho_sign_status: 'sent',
        signing_sent_at: new Date().toISOString()
      })
      .eq('id', msaDocumentId);

    if (updateError) {
      console.error('Failed to update MSA document record:', updateError);
      throw new Error('Failed to update MSA document record after sending for signing');
    }

    // Update user profile to mark MSA as completed since it's been sent for signing
    console.log('Updating user profile MSA completion status...');
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        msa_completed: true,
        msa_status: 'completed',
        msa_completed_at: new Date().toISOString()
      })
      .eq('user_id', msaDoc.user_id);

    if (profileUpdateError) {
      console.error('Failed to update user profile MSA status:', profileUpdateError);
      // Don't throw error here as the main MSA sending was successful
    } else {
      console.log('User profile MSA status updated successfully');
    }

    console.log('=== ✅ MSA document sent for signing successfully ===');

    return new Response(JSON.stringify({
      success: true,
      message: `MSA document sent for signing to ${userProfile.first_name} ${userProfile.last_name} and Mithun`,
      msa_document_id: msaDocumentId,
      user_name: `${userProfile.first_name} ${userProfile.last_name}`,
      organization_name: userProfile.organizations?.name,
      zoho_sign: {
        request_id: requestId,
        document_id: documentId,
        status: 'sent'
      },
      sent_at: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('=== ❌ Error in send-msa-for-signing function ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Try to update MSA document record with error (only if we have msaDocumentId)
    if (msaDocumentId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          await supabase
            .from('msa_documents')
            .update({
              zoho_sign_status: 'failed',
              zoho_sign_error: error.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', msaDocumentId);
          console.log('✅ Updated MSA document record with error status');
        }
      } catch (updateError) {
        console.error('❌ Failed to update error status:', updateError.message);
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      msa_document_id: msaDocumentId,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
