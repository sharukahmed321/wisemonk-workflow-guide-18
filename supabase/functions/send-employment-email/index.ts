import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

interface EmploymentEmailRequest {
  employeeFirstName: string;
  employeeEmail: string;
  organizationName: string;
}

const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { employeeFirstName, employeeEmail, organizationName }: EmploymentEmailRequest = await req.json();

    if (!employeeFirstName || !employeeEmail || !organizationName) {
      return new Response(JSON.stringify({ error: "Employee name, email, and organization name are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log(`Sending employment agreement email to: ${employeeEmail}`);

    const emailResponse = await resend.emails.send({
      from: "Wisemonk <noreply@wisemonk.io>",
      to: [employeeEmail],
      subject: "Complete Your Employment Agreement",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Dear ${employeeFirstName},</p>
          <p>We hope you're doing well! To complete your onboarding process, please fill in your details and sign your Employment Agreement through the secure link below.</p>

          <h3>Access the Document:</h3>
          <p>Click the secure link below to view, complete your details, and sign your employment agreement:</p>

          <p><strong>URL:</strong> <a href="https://sign.wisemonk.io" target="_blank" style="color: #1a73e8;">sign.wisemonk.io</a></p>
          <p><strong>Username:</strong> ${employeeEmail}</p>

          <p>Once you have submitted your details, please check your email inbox for the next steps to sign the document. If you don't see the email, kindly check your spam/junk folder.</p>

          <h3>Important Notes</h3>
          <ul>
              <li><strong>Security:</strong> The e-signature link is unique to you; please do not share it with anyone.</li>
              <li><strong>Questions or Concerns:</strong> Contact <strong>Deepika E</strong> at 
                  <a href="mailto:deepika@wisemonk.co" style="color: #1a73e8;">deepika@wisemonk.co</a> or +91 8904019774.</li>
              <li><strong>Technical Issues:</strong> Reach out to IT support at 
                  <a href="mailto:cs@wisemonk.co" style="color: #1a73e8;">cs@wisemonk.co</a>.</li>
          </ul>

          <p>We look forward to welcoming you to the team at <strong>${organizationName}</strong>. Your prompt attention to this matter is greatly appreciated.</p>

          <p>Best regards,<br/><strong>Team Wisemonk</strong></p>
        </div>
      `
    });

    if (emailResponse.error) {
      console.error("Email error:", emailResponse.error);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log("Employment agreement email sent successfully:", emailResponse);
    return new Response(JSON.stringify({ success: true, message: "Employment agreement email sent successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error("Error in send-employment-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);