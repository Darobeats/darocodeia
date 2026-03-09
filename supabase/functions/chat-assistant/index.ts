import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  locale: "es" | "en";
  currentPage?: string;
}

const PLATFORM_CONTEXT = {
  es: `DaroCode es un ecosistema completo de desarrollo full-stack que integra todas las etapas del ciclo de desarrollo de software.

CARACTERÍSTICAS PRINCIPALES:
- Panel de Control Unificado: Dashboard centralizado con sincronización en tiempo real
- Frontend Ampliado: Conexión nativa con Figma, React, Vue, Angular
- Ecosistema Backend: PostgreSQL, MongoDB, Redis integrados
- Multi-Cloud Nativo: AWS, Google Cloud, Azure, DigitalOcean
- DevOps Integrado: GitHub, GitLab, CI/CD visual
- Seguridad Avanzada: Auth0, Firebase Auth, OAuth, JWT
- Colaboración en Equipo: Espacios compartidos, pair programming remoto
- IA Integrada: Generación de código con IA

CÓMO EMPEZAR:
1. Crea una cuenta gratuita en la página de registro
2. Inicia un nuevo proyecto desde el dashboard
3. Conecta tus herramientas favoritas (GitHub, Figma, etc.)
4. Comienza a desarrollar con todas las integraciones disponibles

PRECIOS:
- Plan Gratuito: Para proyectos personales y pruebas
- Plan Pro: Para equipos pequeños con más integraciones
- Plan Enterprise: Para organizaciones con necesidades avanzadas`,
  en: `DaroCode is a complete full-stack development ecosystem that integrates all stages of the software development cycle.

MAIN FEATURES:
- Unified Control Panel: Centralized dashboard with real-time synchronization
- Enhanced Frontend: Native connection with Figma, React, Vue, Angular
- Backend Ecosystem: PostgreSQL, MongoDB, Redis integrated
- Multi-Cloud Native: AWS, Google Cloud, Azure, DigitalOcean
- Integrated DevOps: GitHub, GitLab, visual CI/CD
- Advanced Security: Auth0, Firebase Auth, OAuth, JWT
- Team Collaboration: Shared spaces, remote pair programming
- Integrated AI: AI code generation

HOW TO GET STARTED:
1. Create a free account on the registration page
2. Start a new project from the dashboard
3. Connect your favorite tools (GitHub, Figma, etc.)
4. Start developing with all available integrations

PRICING:
- Free Plan: For personal projects and testing
- Pro Plan: For small teams with more integrations
- Enterprise Plan: For organizations with advanced needs`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, locale, currentPage }: RequestBody = await req.json();

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch public projects from database
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: projects } = await supabase
      .from("projects")
      .select("name, description, technologies, preview_url")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(10);

    const projectsContext =
      projects && projects.length > 0
        ? projects
            .map(
              (p) =>
                `- ${p.name}: ${p.description || "Sin descripción"} (Tecnologías: ${
                  p.technologies?.join(", ") || "No especificadas"
                })`
            )
            .join("\n")
        : locale === "es"
        ? "No hay proyectos públicos disponibles actualmente."
        : "No public projects currently available.";

    const systemPrompt =
      locale === "es"
        ? `Eres "Daro", el asistente virtual de DaroCode. Eres amigable, profesional y cercano. Tu objetivo es ayudar a los usuarios a:

1. Entender qué es DaroCode y sus características
2. Resolver dudas sobre el uso de la plataforma
3. Proporcionar información sobre proyectos destacados
4. Guiar en el proceso de registro y primeros pasos

CONTEXTO DE LA PLATAFORMA:
${PLATFORM_CONTEXT.es}

PROYECTOS PÚBLICOS DESTACADOS:
${projectsContext}

PÁGINA ACTUAL DEL USUARIO: ${currentPage || "Página principal"}

REGLAS:
- Responde siempre en español
- Sé conciso pero completo (máximo 3-4 párrafos)
- Usa emojis con moderación (1-2 por respuesta máximo)
- Si no sabes algo, admítelo honestamente
- Sugiere acciones concretas cuando sea apropiado
- Si el usuario pregunta sobre un proyecto específico, proporciona detalles si están disponibles
- Mantén un tono conversacional y amigable`
        : `You are "Daro", DaroCode's virtual assistant. You are friendly, professional, and approachable. Your goal is to help users:

1. Understand what DaroCode is and its features
2. Resolve questions about using the platform
3. Provide information about featured projects
4. Guide through the registration process and first steps

PLATFORM CONTEXT:
${PLATFORM_CONTEXT.en}

FEATURED PUBLIC PROJECTS:
${projectsContext}

USER'S CURRENT PAGE: ${currentPage || "Main page"}

RULES:
- Always respond in English
- Be concise but complete (maximum 3-4 paragraphs)
- Use emojis sparingly (1-2 per response maximum)
- If you don't know something, admit it honestly
- Suggest concrete actions when appropriate
- If the user asks about a specific project, provide details if available
- Maintain a conversational and friendly tone`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your account." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
