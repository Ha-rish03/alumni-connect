import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface JobNotificationRequest {
  jobId: string;
  title: string;
  company: string;
  description: string;
  location?: string;
  type: string;
  authorName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { title, company, description, location, type, authorName }: JobNotificationRequest = await req.json();

    console.log("Received job notification request:", { title, company, type, authorName });

    // Get all student emails using service role for full access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get student user IDs
    const { data: studentRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "student");

    if (rolesError) {
      console.error("Error fetching student roles:", rolesError);
      throw new Error("Failed to fetch students");
    }

    if (!studentRoles || studentRoles.length === 0) {
      console.log("No students found to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No students to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const studentIds = studentRoles.map(r => r.user_id);

    // Get student emails from profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .in("user_id", studentIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw new Error("Failed to fetch student emails");
    }

    const emails = profiles?.map(p => p.email).filter(Boolean) || [];

    if (emails.length === 0) {
      console.log("No student emails found");
      return new Response(
        JSON.stringify({ success: true, message: "No student emails found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending notification to ${emails.length} students`);

    // Send email notification
    const jobType = type === "internship" ? "Internship" : "Job";
    const locationText = location ? ` in ${location}` : "";

    const emailResponse = await resend.emails.send({
      from: "Alumni Connect <onboarding@resend.dev>", // Using Resend's test domain
      to: emails,
      subject: `New ${jobType} Opportunity: ${title} at ${company}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New ${jobType} Alert! 🎉</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1e293b; margin-top: 0;">${title}</h2>
            <p style="color: #64748b; margin: 5px 0;"><strong>Company:</strong> ${company}</p>
            ${location ? `<p style="color: #64748b; margin: 5px 0;"><strong>Location:</strong> ${location}</p>` : ""}
            <p style="color: #64748b; margin: 5px 0;"><strong>Posted by:</strong> ${authorName}</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h3 style="color: #1e293b; margin-top: 0;">Description</h3>
              <p style="color: #475569;">${description.substring(0, 300)}${description.length > 300 ? "..." : ""}</p>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
              Log in to the Alumni Connect platform to view the full details and apply!
            </p>
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
            You're receiving this because you're a student on Alumni Connect.
          </p>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailsSent: emails.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-job-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
