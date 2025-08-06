import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmploymentAgreementData {
  user_id: string;
  organization_id: string;
  employee_name: string;
  job_title: string;
  start_date: string;
  salary: string;
  organization_name: string;
  organization_address: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting employment agreement generation...');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header found');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    console.log('✅ User authenticated:', user.id);

    // Get user profile and organization data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations (*)
      `)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    if (!profile.organization_id || !profile.organizations) {
      throw new Error('Organization not found for user');
    }

    console.log('✅ Profile and organization data retrieved');

    // Prepare employment agreement data
    const employmentData: EmploymentAgreementData = {
      user_id: user.id,
      organization_id: profile.organization_id,
      employee_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      job_title: profile.job_title || 'Employee',
      start_date: profile.start_date || new Date().toISOString().split('T')[0],
      salary: profile.annual_gross_salary?.toString() || '0',
      organization_name: profile.organizations.name || 'Company',
      organization_address: `${profile.organizations.business_address || ''}, ${profile.organizations.business_city || ''}, ${profile.organizations.business_state || ''} ${profile.organizations.business_postal_code || ''}`.trim()
    };

    // Generate PDF using Google Docs
    const pdfBuffer = await generateEmploymentAgreementPDF(employmentData);
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `employment-agreement-${employmentData.employee_name.replace(/\s+/g, '-')}-${timestamp}.pdf`;
    const filePath = `${employmentData.organization_id}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employment-agreements')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      throw new Error(`Failed to upload document: ${uploadError.message}`);
    }

    console.log('✅ Document uploaded to storage:', filePath);

    // Get download URL
    const { data: urlData } = await supabase.storage
      .from('employment-agreements')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    // Save document metadata to database
    const { data: docRecord, error: docError } = await supabase
      .from('employment_agreements')
      .insert({
        user_id: employmentData.user_id,
        organization_id: employmentData.organization_id,
        file_name: fileName,
        file_path: filePath,
        file_size: pdfBuffer.byteLength,
        generation_method: 'google_docs_template',
        metadata: {
          employee_name: employmentData.employee_name,
          job_title: employmentData.job_title,
          generated_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (docError) {
      console.error('❌ Database insert error:', docError);
      throw new Error(`Failed to save document record: ${docError.message}`);
    }

    console.log('✅ Employment agreement generated successfully');

    const responseData = {
      success: true,
      document: {
        id: docRecord.id,
        file_name: docRecord.file_name,
        file_path: docRecord.file_path,
        download_url: urlData?.signedUrl,
        created_at: docRecord.created_at,
        is_signed: docRecord.is_signed,
        generation_method: docRecord.generation_method
      }
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('💥 Employment agreement generation failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Employment agreement generation failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function generateEmploymentAgreementPDF(data: EmploymentAgreementData): Promise<Uint8Array> {
  console.log('🔄 Generating PDF from Google Docs template...');
  
  const templateDocId = Deno.env.get('DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID');
  if (!templateDocId) {
    throw new Error('Employment agreement template document ID not configured');
  }

  // Get Google access token
  const accessToken = await getGoogleAccessToken();
  
  // Prepare replacements for the template
  const replacements = {
    '{{EMPLOYEE_NAME}}': data.employee_name,
    '{{JOB_TITLE}}': data.job_title,
    '{{START_DATE}}': formatDate(data.start_date),
    '{{ANNUAL_SALARY}}': formatCurrency(data.salary),
    '{{ORGANIZATION_NAME}}': data.organization_name,
    '{{ORGANIZATION_ADDRESS}}': data.organization_address,
    '{{CURRENT_DATE}}': formatDate(new Date().toISOString()),
  };

  // Generate PDF using Google Docs
  const pdfBuffer = await generatePDFFromTemplate(accessToken, templateDocId, replacements);
  
  console.log('✅ PDF generated successfully, size:', pdfBuffer.byteLength);
  return pdfBuffer;
}

async function getGoogleAccessToken(): Promise<string> {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountKey) {
    throw new Error('Google service account key not configured');
  }

  const credentials = JSON.parse(serviceAccountKey);
  const jwt = await createJWT(credentials);
  return await exchangeJWTForAccessToken(jwt);
}

async function createJWT(credentials: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  const data = `${headerB64}.${payloadB64}`;
  const signature = await signRSA256(data, credentials.private_key);
  
  return `${data}.${signature}`;
}

async function signRSA256(data: string, privateKey: string): Promise<string> {
  const key = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(key), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
  
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(data)
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function exchangeJWTForAccessToken(jwt: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function generatePDFFromTemplate(accessToken: string, templateDocId: string, replacements: Record<string, string>): Promise<Uint8Array> {
  // Create a copy of the template
  const copyResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Employment Agreement - ${new Date().toISOString()}`
    }),
  });

  if (!copyResponse.ok) {
    throw new Error(`Failed to copy template: ${await copyResponse.text()}`);
  }

  const copyData = await copyResponse.json();
  const docId = copyData.id;

  try {
    // Replace placeholders in the document
    const requests = Object.entries(replacements).map(([placeholder, value]) => ({
      replaceAllText: {
        containsText: {
          text: placeholder,
          matchCase: false,
        },
        replaceText: value,
      },
    }));

    if (requests.length > 0) {
      const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to update document: ${await updateResponse.text()}`);
      }
    }

    // Export as PDF
    const exportResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!exportResponse.ok) {
      throw new Error(`Failed to export PDF: ${await exportResponse.text()}`);
    }

    const pdfBuffer = new Uint8Array(await exportResponse.arrayBuffer());
    return pdfBuffer;

  } finally {
    // Clean up the temporary document
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.warn('Failed to delete temporary document:', error);
    }
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatCurrency(amount: string): string {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num);
}