import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { email, fullName, department, staffId } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a temporary password
    const tempPassword = `Athena${Math.random().toString(36).slice(-8)}!`;

    // Create the user via admin API
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || "",
        account_type: "lecturer",
      },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Update the profile with department and staff_id, and approve
    await supabase
      .from("profiles")
      .update({
        department,
        staff_id: staffId,
        approved: true,
        account_expires_at: new Date(Date.now() + 6 * 365.25 * 24 * 60 * 60 * 1000).toISOString(), // 6 years for lecturers
      })
      .eq("user_id", userId);

    // Update role from patron (default) to lecturer
    await supabase
      .from("user_roles")
      .update({ role: "lecturer" })
      .eq("user_id", userId);

    // Send magic link so lecturer can sign in and set their own password
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Lecturer created and invitation sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
