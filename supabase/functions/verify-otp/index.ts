import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { email, code }: VerifyOTPRequest = await req.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: "Email and code are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the OTP code
    const { data: otpRecord, error: fetchError } = await supabaseClient
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .single();

    if (fetchError || !otpRecord) {
      return new Response(JSON.stringify({ 
        error: "Invalid verification code",
        valid: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if code has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(JSON.stringify({ 
        error: "Verification code has expired",
        valid: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check attempt limit (max 5 attempts)
    if (otpRecord.attempts >= 5) {
      return new Response(JSON.stringify({ 
        error: "Too many attempts. Please request a new code.",
        valid: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark OTP as used
    const { error: updateError } = await supabaseClient
      .from('otp_codes')
      .update({ used: true, updated_at: new Date().toISOString() })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('Error marking OTP as used:', updateError);
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the user by email and confirm their email
    const { data: { users }, error: userError } = await supabaseClient.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = users?.find(u => u.email === email);
    
    if (user) {
      // Confirm the user's email
      const { error: confirmError } = await supabaseClient.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (confirmError) {
        console.error('Error confirming email:', confirmError);
        return new Response(JSON.stringify({ error: "Failed to confirm email" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update the profile to reflect email verification
      await supabaseClient
        .from('profiles')
        .update({ email_verified: true })
        .eq('email', email);
    }

    // Clean up old OTP codes
    await supabaseClient.rpc('cleanup_expired_otp_codes');

    console.log('Email verified successfully for:', email);

    return new Response(JSON.stringify({ 
      success: true,
      valid: true,
      message: "Email verified successfully" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error('Error in verify-otp function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);