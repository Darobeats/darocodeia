import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MAX_FILES = 25;
const MAX_FILE_CHARS = 100_000;

const BodySchema = z.object({
  projectId: z.string().uuid(),
  summary: z.string().max(500).optional(),
  files: z
    .array(
      z.object({
        path: z.string().min(1).max(300),
        content: z.string().max(MAX_FILE_CHARS),
        language: z.string().max(40).optional(),
      })
    )
    .min(1)
    .max(MAX_FILES),
});

/** Normalize and validate a project-relative file path. */
function safePath(input: string): string | null {
  const path = input.replace(/\\/g, "/").replace(/^\.?\//, "").trim();
  if (!path || path.length > 300) return null;
  if (path.startsWith("/") || path.includes("..") || path.includes("\0")) return null;
  if (!/^[\w.\-/@]+$/.test(path)) return null;
  return path;
}

function guessLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    css: "css",
    html: "html",
    json: "json",
    md: "markdown",
  };
  return map[ext] ?? "plaintext";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token || token === anonKey) return json({ error: "Unauthorized" }, 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const { projectId, summary, files } = parsed.data;

    const db = createClient(supabaseUrl, serviceKey);

    // Ownership check
    const { data: project } = await db
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!project) return json({ error: "Forbidden" }, 403);

    const rows: Array<{
      project_id: string;
      file_path: string;
      content: string;
      language: string;
    }> = [];
    for (const f of files) {
      const path = safePath(f.path);
      if (!path) continue;
      rows.push({
        project_id: projectId,
        file_path: path,
        content: f.content,
        language: f.language && f.language.length <= 40 ? f.language : guessLanguage(path),
      });
    }
    if (rows.length === 0) return json({ error: "No valid files" }, 400);

    const { data: saved, error: upsertError } = await db
      .from("project_files")
      .upsert(rows, { onConflict: "project_id,file_path" })
      .select("id, file_path, content");
    if (upsertError) {
      console.error("apply-proposal upsert error:", upsertError);
      return json({ error: "Could not save files" }, 500);
    }

    if (saved && saved.length > 0) {
      await db.from("file_versions").insert(
        saved.map((f: { id: string; file_path: string; content: string | null }) => ({
          file_id: f.id,
          project_id: projectId,
          file_path: f.file_path,
          content: f.content,
          change_type: "assistant",
          change_description: (summary ?? "Cambios del asistente").slice(0, 300),
          created_by: user.id,
        }))
      );
    }

    return json({ ok: true, applied: rows.length });
  } catch (error) {
    console.error("apply-proposal error:", error);
    return json({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});
