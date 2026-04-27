import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const files = ["chequi.png", "trueflow.png", "carniceros.png"];
  const results: Record<string, string> = {};

  for (const f of files) {
    const { data, error } = await supabase.storage
      .from("project-assets")
      .download(`thumbnails/${f}`);
    if (error || !data) {
      results[f] = `download failed: ${error?.message}`;
      continue;
    }
    const { error: upErr } = await supabase.storage
      .from("public-assets")
      .upload(`thumbnails/${f}`, data, { contentType: "image/png", upsert: true });
    results[f] = upErr ? `upload failed: ${upErr.message}` : "ok";
  }

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
