import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, projectId, promptId, existingFiles } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build context from existing files
    const existingFilesContext = existingFiles?.length > 0
      ? `\n\nExisting files in the project:\n${existingFiles.map((f: { path: string; content: string }) => 
          `--- ${f.path} ---\n${f.content || "(empty)"}`
        ).join("\n\n")}`
      : "";

    const systemPrompt = `You are an expert code generator for a web application builder. 
You generate clean, modern, production-ready code based on user requests.

When generating code:
1. Use React with TypeScript
2. Use Tailwind CSS for styling
3. Create modular, reusable components
4. Follow best practices for accessibility and performance
5. Include helpful comments

IMPORTANT: You MUST respond with a JSON object containing:
- "response": A brief explanation of what you created (in Spanish)
- "files": An array of file objects with "path" and "content" properties

Example response format:
{
  "response": "He creado una landing page con un hero section moderno y una navbar responsive.",
  "files": [
    {
      "path": "src/components/Navbar.tsx",
      "content": "import React from 'react';\\n..."
    },
    {
      "path": "src/components/Hero.tsx", 
      "content": "import React from 'react';\\n..."
    }
  ]
}

Always respond in valid JSON format. Do not include markdown code blocks.${existingFilesContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        await supabase
          .from("project_prompts")
          .update({ status: "error", response: "Rate limit exceeded. Please try again later." })
          .eq("id", promptId);
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        await supabase
          .from("project_prompts")
          .update({ status: "error", response: "Payment required. Please add credits." })
          .eq("id", promptId);
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the AI response
    let parsedResponse: { response: string; files: Array<{ path: string; content: string }> };
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      parsedResponse = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback: treat as plain text response
      parsedResponse = {
        response: content,
        files: [],
      };
    }

    // Update prompt with response
    await supabase
      .from("project_prompts")
      .update({
        response: parsedResponse.response,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", promptId);

    // Create or update files
    if (parsedResponse.files && parsedResponse.files.length > 0) {
      for (const file of parsedResponse.files) {
        const ext = file.path.split(".").pop()?.toLowerCase();
        const langMap: Record<string, string> = {
          ts: "typescript",
          tsx: "typescript",
          js: "javascript",
          jsx: "javascript",
          css: "css",
          html: "html",
          json: "json",
          md: "markdown",
        };

        await supabase.from("project_files").upsert(
          {
            project_id: projectId,
            file_path: file.path,
            content: file.content,
            language: langMap[ext || ""] || "plaintext",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "project_id,file_path" }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, filesCreated: parsedResponse.files?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-code error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
