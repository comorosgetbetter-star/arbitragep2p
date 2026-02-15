import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    // Validate phone input
    if (!phone || typeof phone !== "string" || phone.length < 7 || phone.length > 20) {
      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize: only allow digits, +, -, spaces, parens
    const sanitizedPhone = phone.replace(/[^0-9+\-() ]/g, '').trim();
    if (!sanitizedPhone || sanitizedPhone.length < 7) {
      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check profiles table first
    const { data: profileMatch } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", sanitizedPhone)
      .maybeSingle();

    if (profileMatch) {
      return new Response(JSON.stringify({ exists: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check auth.users metadata for CONFIRMED users only
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (error) {
      console.error("Error listing users:", error);
      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only consider users who have confirmed their email
    const phoneExists = users?.some(
      (user) => user.email_confirmed_at && user.user_metadata?.phone === sanitizedPhone
    );

    return new Response(JSON.stringify({ exists: !!phoneExists }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ exists: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
