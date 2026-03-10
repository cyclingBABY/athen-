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

    // Find profiles with expired accounts
    const { data: expiredProfiles, error: fetchError } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .not("account_expires_at", "is", null)
      .lt("account_expires_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!expiredProfiles || expiredProfiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired accounts found", cleared: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let cleared = 0;
    for (const profile of expiredProfiles) {
      // Delete the auth user (cascades to profiles, roles, etc.)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(profile.user_id);
      if (deleteError) {
        console.error(`Failed to delete user ${profile.user_id}:`, deleteError.message);
      } else {
        cleared++;
        console.log(`Cleared expired account: ${profile.email} (${profile.user_id})`);
      }
    }

    return new Response(
      JSON.stringify({ message: `Cleared ${cleared} expired accounts`, cleared }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
