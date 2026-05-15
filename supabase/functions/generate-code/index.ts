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
    const { prompt, projectId, promptId, existingFiles, websiteContext, referenceImages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- Ownership verification ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller owns the project
    const { data: proj } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!proj) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // --- End ownership verification ---

    // Verify the promptId (if provided) belongs to this project
    let safePromptId: string | null = null;
    if (promptId) {
      const { data: ownedPrompt } = await supabase
        .from("project_prompts")
        .select("id")
        .eq("id", promptId)
        .eq("project_id", projectId)
        .maybeSingle();
      if (ownedPrompt) safePromptId = ownedPrompt.id;
    }


    // Fetch project context (memory)
    const { data: projectContext } = await supabase
      .from("project_context")
      .select("context_type, key, value")
      .eq("project_id", projectId);

    // Format project memory for the prompt
    let projectMemoryPrompt = "";
    if (projectContext && projectContext.length > 0) {
      const sections: string[] = [];

      const techStack = projectContext.filter((c: { context_type: string }) => c.context_type === "tech_stack");
      const styleGuide = projectContext.filter((c: { context_type: string }) => c.context_type === "style_guide");
      const preferences = projectContext.filter((c: { context_type: string }) => c.context_type === "learned_preference");
      const businessRules = projectContext.filter((c: { context_type: string }) => c.context_type === "business_rules");

      if (techStack.length > 0) {
        sections.push(`TECH STACK:\n${techStack.map((t: { key: string; value: unknown }) =>
          `- ${t.key}: ${JSON.stringify(t.value)}`
        ).join("\n")}`);
      }

      if (styleGuide.length > 0) {
        sections.push(`STYLE GUIDE:\n${styleGuide.map((s: { key: string; value: unknown }) =>
          `- ${s.key}: ${JSON.stringify(s.value)}`
        ).join("\n")}`);
      }

      if (preferences.length > 0) {
        sections.push(`USER PREFERENCES:\n${preferences.map((p: { key: string; value: unknown }) =>
          `- ${p.key}: ${JSON.stringify(p.value)}`
        ).join("\n")}`);
      }

      if (businessRules.length > 0) {
        sections.push(`BUSINESS RULES:\n${businessRules.map((b: { key: string; value: unknown }) =>
          `- ${b.key}: ${JSON.stringify(b.value)}`
        ).join("\n")}`);
      }

      if (sections.length > 0) {
        projectMemoryPrompt = `

=== PROJECT MEMORY ===
This project has learned preferences. ALWAYS maintain consistency with these guidelines:

${sections.join("\n\n")}

Use these project-specific settings when generating code.
`;
      }
    }

    // Build context from existing files
    const existingFilesContext = existingFiles?.length > 0
      ? `\n\nExisting files in the project:\n${existingFiles.map((f: { path: string; content: string }) =>
          `--- ${f.path} ---\n${f.content || "(empty)"}`
        ).join("\n\n")}`
      : "";

    // Build website context for duplication
    let websiteContextPrompt = "";
    if (websiteContext) {
      const brandingInfo = websiteContext.branding ? `
BRANDING INFORMATION:
- Color Scheme: ${websiteContext.branding.colorScheme || "Unknown"}
- Primary Color: ${websiteContext.branding.colors?.primary || "Not detected"}
- Secondary Color: ${websiteContext.branding.colors?.secondary || "Not detected"}
- Background: ${websiteContext.branding.colors?.background || "Not detected"}
- Text Color: ${websiteContext.branding.colors?.textPrimary || "Not detected"}
- Fonts: ${websiteContext.branding.fonts?.map((f: { family: string }) => f.family).join(", ") || "Not detected"}
` : "";

      websiteContextPrompt = `

=== WEBSITE DUPLICATION CONTEXT ===
The user wants to duplicate/replicate a webpage. Use the following information to create an accurate replica:

Original URL: ${websiteContext.url}
Title: ${websiteContext.metadata?.title || "Unknown"}
Description: ${websiteContext.metadata?.description || "No description"}
${brandingInfo}
PAGE CONTENT (Markdown):
${websiteContext.markdown?.slice(0, 10000) || "No content extracted"}

IMPORTANT: Create components that closely match the original page structure, styling, and content. Use the exact colors and fonts detected when possible.
`;
    }

    // Build image reference instructions if images are provided
    const imageInstructions = referenceImages?.length > 0
      ? `

IMPORTANT - REFERENCE IMAGES PROVIDED:
The user has provided ${referenceImages.length} reference image(s) for visual guidance.
- Carefully analyze the design, colors, layout, typography, spacing, and UI patterns visible in the image(s).
- Replicate the visual style as closely as possible using Tailwind CSS.
- Extract and use the exact colors visible in the images.
- Match the component structure and hierarchy shown in the design.
- Pay attention to shadows, borders, border-radius, and other visual details.
`
      : "";

    const systemPrompt = `You are an expert code generator for a web application builder. 
You generate clean, modern, production-ready code based on user requests.
${projectMemoryPrompt}${imageInstructions}
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

Always respond in valid JSON format. Do not include markdown code blocks.${existingFilesContext}${websiteContextPrompt}`;

    // Build user message - multimodal if images are provided
    type MessageContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>;

    let userMessageContent: MessageContent = prompt;

    if (referenceImages?.length > 0) {
      userMessageContent = [
        { type: "text", text: prompt },
        ...referenceImages.map((img: { url: string; name: string }) => ({
          type: "image_url",
          image_url: { url: img.url },
        })),
      ];
    }

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
          { role: "user", content: userMessageContent },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        if (safePromptId) {
          await supabase
            .from("project_prompts")
            .update({ status: "error", response: "Rate limit exceeded. Please try again later." })
            .eq("id", safePromptId);
        }
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        if (safePromptId) {
          await supabase
            .from("project_prompts")
            .update({ status: "error", response: "Payment required. Please add credits." })
            .eq("id", safePromptId);
        }
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
      parsedResponse = {
        response: content,
        files: [],
      };
    }

    // Update prompt with response
    if (safePromptId) {
      await supabase
        .from("project_prompts")
        .update({
          response: parsedResponse.response,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", safePromptId);
    }

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
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
