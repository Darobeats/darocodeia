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

const BodySchema = z.object({
  action: z.enum([
    "list",
    "create",
    "set_password",
    "send_reset",
    "delete",
    "list_user_projects",
    "list_requests",
  ]),
  userId: z.string().uuid().optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().min(8).max(72).optional(),
  fullName: z.string().max(120).optional(),
  redirectTo: z.string().url().max(300).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const token = (req.headers.get("Authorization") ?? "")
      .replace(/^Bearer\s+/i, "")
      .trim();
    if (!token || token === anonKey) return json({ error: "Unauthorized" }, 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    // Only the single super admin may use this function: admin role AND the exact email.
    const { data: isAdmin, error: roleError } = await admin.rpc("is_super_admin", {
      _user_id: user.id,
    });
    const isSuperEmail =
      (user.email ?? "").toLowerCase() === SUPER_ADMIN_EMAIL;
    if (roleError || !isAdmin || !isSuperEmail) return json({ error: "Forbidden" }, 403);

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const { action, userId, email, password, fullName, redirectTo } = parsed.data;

    switch (action) {
      case "list": {
        const { data, error } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (error) throw error;

        const ids = data.users.map((u) => u.id);
        const [{ data: projects }, { data: roles }] = await Promise.all([
          admin.from("projects").select("id, user_id").in("user_id", ids),
          admin.from("user_roles").select("user_id, role").in("user_id", ids),
        ]);

        const counts = new Map<string, number>();
        (projects ?? []).forEach((p: { user_id: string }) =>
          counts.set(p.user_id, (counts.get(p.user_id) ?? 0) + 1)
        );
        const roleMap = new Map<string, string[]>();
        (roles ?? []).forEach((r: { user_id: string; role: string }) => {
          roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role]);
        });

        return json({
          users: data.users.map((u) => ({
            id: u.id,
            email: u.email,
            fullName:
              (u.user_metadata?.full_name as string | undefined) ??
              (u.user_metadata?.name as string | undefined) ??
              "",
            createdAt: u.created_at,
            lastSignInAt: u.last_sign_in_at,
            projectCount: counts.get(u.id) ?? 0,
            roles: roleMap.get(u.id) ?? [],
            isSelf: u.id === user.id,
          })),
        });
      }

      case "create": {
        if (!email || !password) return json({ error: "Invalid request" }, 400);
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName ?? "" },
        });
        if (error) return json({ error: error.message }, 400);
        return json({ id: data.user?.id });
      }

      case "set_password": {
        if (!userId || !password) return json({ error: "Invalid request" }, 400);
        const { error } = await admin.auth.admin.updateUserById(userId, { password });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "send_reset": {
        if (!email) return json({ error: "Invalid request" }, 400);
        const { error } = await admin.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "delete": {
        if (!userId) return json({ error: "Invalid request" }, 400);
        if (userId === user.id) return json({ error: "No puedes eliminar tu propia cuenta" }, 400);
        const { data: targetRoles } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin");
        if (targetRoles && targetRoles.length > 0) {
          return json({ error: "No se puede eliminar a un administrador" }, 400);
        }
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "list_user_projects": {
        if (!userId) return json({ error: "Invalid request" }, 400);
        const { data, error } = await admin
          .from("projects")
          .select("id, name, description, status, is_public, created_at, updated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return json({ projects: data ?? [] });
      }

      case "list_requests": {
        const { data, error } = await admin
          .from("access_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        return json({ requests: data ?? [] });
      }
    }

    return json({ error: "Invalid request" }, 400);
  } catch (error) {
    console.error("admin-users error:", error);
    return json({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});
