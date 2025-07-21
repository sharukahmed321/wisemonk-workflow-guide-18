
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { generateAgreementPDF } from './pdf-generator.ts';

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

    // Fetch user profile and organization data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        first_name,
        last_name,
        job_title,
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

    console.log('🔄 Generating PDF with MSA data...');
    
    // Get template document ID from secrets
    const templateDocId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID');
    
    // Generate the MSA agreement PDF
    const pdfBuffer = await generateAgreementPDF(msaData, templateDocId);
    
    console.log('✅ MSA agreement PDF generated successfully, size:', pdfBuffer.length);

    // Return the PDF as a response
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="MSA_${organization.name}_${Date.now()}.pdf"`,
      },
    });

  } catch (error) {
    console.error('💥 Error in generate-msa-agreement function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate MSA agreement'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
