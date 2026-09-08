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

const MODEL = "google/gemini-3.8-flash";

const PLATFORM_CONTEXT = {
  es: `DaroCode es un ecosistema completo de desarrollo full-stack que integra todas las etapas del ciclo de desarrollo de software.

CARACTERÍSTICAS PRINCIPALES:
- Panel de control unificado: dashboard centralizado con métricas y actividad
- Generación de código con IA: describe lo que quieres y la plataforma crea los archivos del proyecto
- Editor en vivo: código y vista previa lado a lado, con consola, tamaños de pantalla (escritorio/tableta/móvil), navegación entre páginas, pantalla completa y apertura en otra pestaña
- Historial de versiones y comparación de cambios (diff) por archivo
- Duplicación de webs: pega una URL y la plataforma extrae contenido, colores y tipografías como referencia
- Biblioteca de fragmentos reutilizables (snippets)
- GitHub: importar un repositorio como proyecto y exportar/enviar cambios
- Visor de enlaces: /view/<url> abre un sitio externo dentro de DaroCode y permite compartir ese enlace
- Portafolio público con proyectos destacados en la página principal
- Bilingüe (español / inglés) y tema oscuro
- Seguridad: cuentas con correo o Google, permisos por usuario y datos privados por proyecto

RUTAS ÚTILES:
- /register : crear cuenta gratis
- /login : iniciar sesión (correo o Google)
- /dashboard : panel principal
- /dashboard/projects : proyectos, crear proyecto o importar desde GitHub
- /dashboard/featured : administración de proyectos destacados (solo administradores)
- /docs : documentación
- /view : abrir un enlace externo dentro de la página

CÓMO EMPEZAR (PASO A PASO):
1. Crea tu cuenta en /register (o entra con Google).
2. Ve a /dashboard/projects y pulsa "Nuevo proyecto"; elige plantilla o empieza en blanco.
3. Dentro del proyecto escribe en el chat de IA lo que quieres construir (ej. "una landing con navbar, hero y precios").
4. Revisa el resultado en la vista previa; usa la barra de direcciones de la previa para recorrer las páginas.
5. Ajusta el código en el editor: se guarda automáticamente y queda en el historial de versiones.
6. Exporta a GitHub desde el proyecto o compártelo públicamente.

IMPORTAR DESDE GITHUB (PASO A PASO):
1. Entra en /dashboard/projects y pulsa "Importar desde GitHub".
2. Conecta tu cuenta de GitHub (autorización segura; el permiso se guarda en el servidor).
3. Busca el repositorio, elige la rama y confirma la importación.
4. El repositorio se abre como proyecto y puedes pedirle a la IA que lo analice o lo mejore.

PRECIOS:
- Plan Gratuito: proyectos personales y pruebas
- Plan Pro: equipos pequeños, más integraciones
- Plan Enterprise: organizaciones con necesidades avanzadas`,
  en: `DaroCode is a complete full-stack development ecosystem covering every stage of the software development cycle.

MAIN FEATURES:
- Unified control panel: centralized dashboard with metrics and activity
- AI code generation: describe what you want and the platform writes the project files
- Live editor: code and preview side by side, with console, screen sizes (desktop/tablet/mobile), page navigation, full screen and open-in-new-tab
- Version history and per-file diff comparison
- Website duplication: paste a URL and the platform extracts content, colors and fonts as reference
- Reusable snippet library
- GitHub: import a repository as a project and export/push changes
- Link viewer: /view/<url> opens an external site inside DaroCode and lets you share that link
- Public portfolio with featured projects on the landing page
- Bilingual (Spanish / English) and dark theme
- Security: email or Google accounts, per-user permissions, private project data

USEFUL ROUTES:
- /register : create a free account
- /login : sign in (email or Google)
- /dashboard : main dashboard
- /dashboard/projects : projects, create a project or import from GitHub
- /dashboard/featured : featured-projects admin (admins only)
- /docs : documentation
- /view : open an external link inside the site

GETTING STARTED (STEP BY STEP):
1. Create your account at /register (or sign in with Google).
2. Go to /dashboard/projects and click "New project"; pick a template or start blank.
3. Inside the project, tell the AI chat what to build (e.g. "a landing page with navbar, hero and pricing").
4. Check the result in the preview; use the preview address bar to walk through the pages.
5. Tweak the code in the editor: it saves automatically and every change is kept in version history.
6. Export to GitHub from the project or share it publicly.

IMPORT FROM GITHUB (STEP BY STEP):
1. Open /dashboard/projects and click "Import from GitHub".
2. Connect your GitHub account (secure authorization; the grant is stored server-side).
3. Search the repository, choose the branch and confirm the import.
4. The repo opens as a project and you can ask the AI to analyze or improve it.

PRICING:
- Free plan: personal projects and testing
- Pro plan: small teams, more integrations
- Enterprise plan: organizations with advanced needs`,
};

// Simple in-memory per-user rate limit: 30 requests/min.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimitOk(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // --- Authentication: signed-in users only ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token || token === supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rateLimitOk(user.id)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const rawMessages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
    const messages = rawMessages
      .filter(
        (m) =>
          m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    const locale: "es" | "en" = body.locale === "en" ? "en" : "es";
    const safeCurrentPage = (typeof body.currentPage === "string" ? body.currentPage : "")
      .replace(/[\r\n]+/g, " ")
      .replace(/[^\w\s\-/.:]/g, "")
      .slice(0, 100);
    const currentPage = safeCurrentPage || (locale === "es" ? "Página principal" : "Main page");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Public projects for context (service role: read-only, no user data exposed)
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: projects } = await supabase
      .from("projects")
      .select("name, description, technologies")
      .eq("is_public", true)
      .order("featured_order", { ascending: true, nullsFirst: false })
      .limit(10);

    const projectsContext =
      projects && projects.length > 0
        ? projects
            .map(
              (p) =>
                `- ${p.name}: ${
                  p.description || (locale === "es" ? "Sin descripción" : "No description")
                } (${
                  p.technologies?.join(", ") ||
                  (locale === "es" ? "sin tecnologías" : "no technologies")
                })`
            )
            .join("\n")
        : locale === "es"
        ? "No hay proyectos públicos disponibles actualmente."
        : "No public projects currently available.";

    const systemPrompt =
      locale === "es"
        ? `Eres "Daro", el asistente virtual experto de DaroCode. Conoces la plataforma a fondo y acompañas al usuario paso a paso.

CONTEXTO DE LA PLATAFORMA:
${PLATFORM_CONTEXT.es}

PROYECTOS PÚBLICOS DESTACADOS:
${projectsContext}

PÁGINA ACTUAL DEL USUARIO: ${currentPage}

REGLAS:
- Responde siempre en español, con tono cercano y profesional.
- Sé concreto: cuando el usuario quiera hacer algo, da pasos numerados y nombra la ruta exacta (por ejemplo /dashboard/projects).
- Máximo 4 párrafos o una lista corta de pasos. Usa como máximo 2 emojis.
- Si algo no existe en la plataforma, dilo con honestidad y ofrece la alternativa más cercana.
- Si preguntan por un proyecto destacado, usa la información de arriba.
- Nunca inventes precios, funciones ni datos que no estén en este contexto.`
        : `You are "Daro", DaroCode's expert virtual assistant. You know the platform deeply and guide users step by step.

PLATFORM CONTEXT:
${PLATFORM_CONTEXT.en}

FEATURED PUBLIC PROJECTS:
${projectsContext}

USER'S CURRENT PAGE: ${currentPage}

RULES:
- Always answer in English, friendly and professional.
- Be concrete: when the user wants to do something, give numbered steps and name the exact route (e.g. /dashboard/projects).
- Maximum 4 paragraphs or a short step list. Use at most 2 emojis.
- If something does not exist in the platform, say so honestly and offer the closest alternative.
- If asked about a featured project, use the information above.
- Never invent pricing, features or data that is not in this context.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
