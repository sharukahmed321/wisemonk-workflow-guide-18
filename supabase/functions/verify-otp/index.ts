import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  otp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, otp }: VerifyOTPRequest = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Verifying OTP for: ${email}`);

    // Clean up expired OTP codes first
    await supabase.rpc('cleanup_expired_otp_codes');

    // Find the OTP code
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("code", otp)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Database error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Database error occurred" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!otpRecord) {
      // Check if there are any OTP records for this email to provide better error messaging
      const { data: anyOTPRecord } = await supabase
        .from("otp_codes")
        .select("id, used, expires_at")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let errorMessage = "Invalid OTP code";
      if (anyOTPRecord) {
        if (anyOTPRecord.used) {
          errorMessage = "This OTP code has already been used. Please request a new one.";
        } else if (new Date(anyOTPRecord.expires_at) < new Date()) {
          errorMessage = "This OTP code has expired. Please request a new one.";
        } else {
          errorMessage = "Invalid OTP code. Please check and try again.";
        }
      } else {
        errorMessage = "No OTP code found for this email. Please request a new one.";
      }

      console.log(`Invalid OTP attempt for: ${email} - ${errorMessage}`);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark OTP as used
    const { error: updateError } = await supabase
      .from("otp_codes")
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq("id", otpRecord.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update OTP status" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // This is a pre-registration flow - OTP verification happens before user creation
    // Just mark the OTP as verified; user creation will happen in the frontend after verification
    console.log(`Email ${email} verified successfully via OTP`);
    
    // Optional: Store verified emails in a temporary table or mark in otp_codes
    // For now, we just rely on the OTP being marked as used

    console.log("OTP verified successfully for:", email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email verification successful" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);