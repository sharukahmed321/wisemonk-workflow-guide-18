import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employeeId, personalDetails, stepNumber, finalizeStatus } = await req.json();

    console.log('🔄 Updating preboarding data for employee:', employeeId);
    console.log('📝 Step:', stepNumber);
    console.log('📋 Data:', JSON.stringify(personalDetails, null, 2));

    // Create Supabase client with service role key for elevated permissions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    if (stepNumber === 1 && personalDetails) {
      // Check if another employee already has this Aadhaar number
      const { data: existingEmployee } = await supabaseAdmin
        .from('employees')
        .select('id, aadhaar_number')
        .eq('aadhaar_number', personalDetails.aadhaarNumber)
        .neq('id', employeeId)
        .single();

      if (existingEmployee) {
        console.error('❌ Aadhaar number already exists for another employee');
        return new Response(
          JSON.stringify({ 
            error: 'This Aadhaar number is already registered with another employee. Please check and enter the correct Aadhaar number.',
            success: false,
            code: 'DUPLICATE_AADHAAR'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        );
      }

      // Update personal details
      const { data, error } = await supabaseAdmin
        .from('employees')
        .update({
          full_name: personalDetails.fullName,
          father_name: personalDetails.fatherName,
          date_of_birth: personalDetails.dateOfBirth ? new Date(personalDetails.dateOfBirth).toISOString().split('T')[0] : null,
          aadhaar_number: personalDetails.aadhaarNumber,
          address_line_1: personalDetails.addressLine1,
          address_line_2: personalDetails.addressLine2,
          city: personalDetails.city,
          state: personalDetails.state,
          pincode: personalDetails.pincode,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId)
        .select();

      if (error) {
        console.error('❌ Error updating employee data:', error);
        
        // Handle specific constraint violations
        if (error.code === '23505' && error.message.includes('aadhaar_number')) {
          return new Response(
            JSON.stringify({ 
              error: 'This Aadhaar number is already registered. Please check and enter the correct Aadhaar number.',
              success: false,
              code: 'DUPLICATE_AADHAAR'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            },
          );
        }
        
        throw new Error(`Failed to update employee data: ${error.message}`);
      }

      console.log('✅ Successfully updated employee data:', data);
    }

    // Handle final completion - update status to Onboarding
    if (stepNumber === 'complete' && finalizeStatus) {
      const { data, error } = await supabaseAdmin
        .from('employees')
        .update({
          status: 'Onboarding',
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId)
        .select();

      if (error) {
        console.error('❌ Error finalizing employee status:', error);
        throw new Error(`Failed to finalize employee status: ${error.message}`);
      }

      console.log('✅ Employee status updated to Onboarding:', data);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Step ${stepNumber} data updated successfully` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('💥 Error in update-preboarding-data function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
})