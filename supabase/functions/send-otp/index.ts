import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
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

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { email }: SendOTPRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending OTP to: ${email}`);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up expired OTP codes
    await supabase.rpc('cleanup_expired_otp_codes');

    // Store OTP in database
    const { error: dbError } = await supabase
      .from("otp_codes")
      .insert({
        email,
        code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to store OTP code" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send OTP via email
    const emailResponse = await resend.emails.send({
      from: "Wisemonk <onboarding@resend.dev>",
      to: [email],
      subject: "Your Verification Code - Wisemonk",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #5048E5; margin: 0;">Wisemonk</h1>
          </div>
          
          <h2 style="color: #333; text-align: center;">Your Verification Code</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Hi there! Thanks for signing up with Wisemonk. Please use the verification code below to complete your account setup:
          </p>
          
          <div style="background-color: #f8f9fa; border: 2px dashed #5048E5; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #5048E5; letter-spacing: 8px;">${otp}</span>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px;">
              © 2025 Wisemonk. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error("Email error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("OTP sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully" 
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
    console.error("Error in send-otp function:", error);
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