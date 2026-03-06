import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Use Lovable AI to generate and send a notification
    // For now, we'll use a simple approach via the Supabase auth admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Send a password recovery email as a way to notify (hacky but works without custom email setup)
    // Actually, let's use the Lovable API to send a transactional email
    const response = await fetch(`https://api.lovable.dev/v1/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        to: email,
        subject: "🎉 Your Athena Library Account Has Been Approved!",
        purpose: "transactional",
        html: `
          <div style="font-family: 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 50px; height: 50px; background: #1a1a2e; border-radius: 12px; line-height: 50px; font-size: 24px;">📚</div>
              <h1 style="color: #1a1a2e; margin: 16px 0 4px; font-size: 24px;">Athena Library</h1>
              <p style="color: #888; font-size: 14px; margin: 0;">Library Management System</p>
            </div>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <div style="font-size: 32px; margin-bottom: 8px;">✅</div>
              <h2 style="color: #166534; margin: 0 0 8px; font-size: 20px;">Account Approved!</h2>
              <p style="color: #15803d; margin: 0; font-size: 14px;">Your library account has been verified and activated.</p>
            </div>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              Hi <strong>${fullName || "there"}</strong>,
            </p>
            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              Great news! Your Athena Library account has been approved by an administrator. You can now sign in and start using all library services:
            </p>
            
            <ul style="color: #555; font-size: 14px; line-height: 2;">
              <li>📖 Browse and search the full book catalog</li>
              <li>📋 Reserve books online</li>
              <li>📱 Access digital resources</li>
              <li>🪪 Print your library card</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/auth" 
                 style="display: inline-block; background: #1a1a2e; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Sign In Now
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated message from Athena Library Management System.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Email API error:", errorText);
      throw new Error(`Email API returned ${response.status}: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending approval email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
