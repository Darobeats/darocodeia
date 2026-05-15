import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_FILES = 800;
const MAX_FILE_SIZE = 512 * 1024; // 512 KB
const TEXT_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "json", "html", "css", "scss",
  "md", "mdx", "txt", "yml", "yaml", "toml", "xml", "svg", "py", "rb",
  "go", "rs", "java", "kt", "swift", "c", "cpp", "h", "hpp", "cs", "php",
  "sh", "bash", "zsh", "sql", "env", "gitignore", "lock", "graphql", "vue",
  "astro", "svelte",
]);

function isTextFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (TEXT_EXTENSIONS.has(ext)) return true;
  // root config files without extensions
  const base = path.split("/").pop() ?? "";
  if (["Dockerfile", "Makefile", "README", "LICENSE", ".gitignore", ".env"].includes(base)) {
    return true;
  }
  return false;
}

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    json: "json", html: "html", css: "css", scss: "scss", md: "markdown",
    py: "python", rb: "ruby", go: "go", rs: "rust", java: "java",
    sh: "bash", sql: "sql", yml: "yaml", yaml: "yaml",
  };
  return map[ext] ?? "plaintext";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { owner, repo, branch } = await req.json();
    if (!owner || !repo || typeof owner !== "string" || typeof repo !== "string") {
      return new Response(JSON.stringify({ error: "owner and repo are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Basic input validation
    const safe = /^[a-zA-Z0-9_.-]+$/;
    if (!safe.test(owner) || !safe.test(repo)) {
      return new Response(JSON.stringify({ error: "Invalid owner or repo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const token = connection.access_token;
    const ghHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    };

    // Get repo info to find default branch + commit sha
    const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders });
    if (!repoResp.ok) {
      return new Response(JSON.stringify({ error: "Repository not found or no access" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const repoInfo = await repoResp.json();
    const targetBranch = branch || repoInfo.default_branch || "main";

    // Get branch ref
    const branchResp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches/${targetBranch}`,
      { headers: ghHeaders }
    );
    if (!branchResp.ok) {
      return new Response(JSON.stringify({ error: `Branch ${targetBranch} not found` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const branchInfo = await branchResp.json();
    const treeSha = branchInfo.commit.commit.tree.sha;
    const commitSha = branchInfo.commit.sha;

    // Get full tree (recursive)
    const treeResp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
      { headers: ghHeaders }
    );
    if (!treeResp.ok) {
      return new Response(JSON.stringify({ error: "Failed to read repo tree" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const treeData = await treeResp.json();
    const allFiles = (treeData.tree as any[]).filter(
      (n) => n.type === "blob" && isTextFile(n.path) && n.size <= MAX_FILE_SIZE
    );
    if (allFiles.length === 0) {
      return new Response(JSON.stringify({ error: "No importable text files found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const files = allFiles.slice(0, MAX_FILES);

    // Create project
    const { data: project, error: projectError } = await admin
      .from("projects")
      .insert({
        user_id: user.id,
        name: repo,
        description: repoInfo.description || `Imported from ${repoInfo.full_name}`,
        status: "active",
      })
      .select()
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: projectError?.message || "Failed to create project" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch blobs in batches of 10 in parallel
    const fileRows: any[] = [];
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const contents = await Promise.all(batch.map(async (f) => {
        try {
          const blobResp = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/blobs/${f.sha}`,
            { headers: ghHeaders }
          );
          if (!blobResp.ok) return null;
          const blob = await blobResp.json();
          if (blob.encoding !== "base64") return null;
          // Decode base64
          const binary = atob(blob.content.replace(/\n/g, ""));
          // Convert to UTF-8 string
          const bytes = new Uint8Array(binary.length);
          for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
          const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
          return { path: f.path, content: text };
        } catch {
          return null;
        }
      }));
      for (const c of contents) {
        if (c) {
          fileRows.push({
            project_id: project.id,
            file_path: c.path,
            content: c.content,
            language: detectLanguage(c.path),
          });
        }
      }
    }

    // Insert files in chunks
    const chunkSize = 100;
    for (let i = 0; i < fileRows.length; i += chunkSize) {
      const chunk = fileRows.slice(i, i + chunkSize);
      const { error: insertError } = await admin.from("project_files").insert(chunk);
      if (insertError) {
        console.error("Failed to insert files chunk:", insertError);
      }
    }

    // Save GitHub metadata in project_context
    await admin.from("project_context").insert({
      project_id: project.id,
      context_type: "github",
      key: "source_repo",
      value: {
        owner,
        repo,
        full_name: repoInfo.full_name,
        branch: targetBranch,
        commit_sha: commitSha,
        html_url: repoInfo.html_url,
        imported_at: new Date().toISOString(),
        file_count: fileRows.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        project_id: project.id,
        files_imported: fileRows.length,
        files_skipped: allFiles.length - files.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GitHub import error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
