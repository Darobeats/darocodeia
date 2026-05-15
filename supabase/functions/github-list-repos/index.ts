import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRole);
    const { data: connection } = await admin
      .from("github_connections")
      .select("access_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!connection?.access_token) {
      return new Response(JSON.stringify({ error: "GitHub not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch up to 100 repos sorted by updated
    const ghResp = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
      {
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!ghResp.ok) {
      return new Response(JSON.stringify({ error: "Failed to list repos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const repos = await ghResp.json();
    const slim = repos.map((r: any) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      description: r.description,
      default_branch: r.default_branch,
      updated_at: r.updated_at,
      language: r.language,
      html_url: r.html_url,
    }));

    return new Response(JSON.stringify({ repos: slim }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("github-list-repos error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
