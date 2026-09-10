import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  KeyRound,
  Trash2,
  UserPlus,
  FolderOpen,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string | null;
  fullName: string;
  createdAt: string;
  lastSignInAt: string | null;
  projectCount: number;
  roles: string[];
  isSelf: boolean;
}

interface UserProject {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  is_public: boolean | null;
  created_at: string;
  updated_at: string;
}

async function callAdmin<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: payload,
  });
  if (error) throw error;
  if (data && typeof data === "object" && "error" in data) {
    throw new Error(String((data as { error: string }).error));
  }
  return data as T;
}

const fmt = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function AdminUsers() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [pwUser, setPwUser] = useState<AdminUser | null>(null);
  const [pwValue, setPwValue] = useState("");

  const [delUser, setDelUser] = useState<AdminUser | null>(null);
  const [delConfirm, setDelConfirm] = useState("");

  const [projectsUser, setProjectsUser] = useState<AdminUser | null>(null);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callAdmin<{ users: AdminUser[] }>({ action: "list" });
      setUsers(res.users);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "No pudimos cargar los usuarios"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminLoading && isAdmin) load();
  }, [adminLoading, isAdmin, load]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/dashboard", { replace: true });
  }, [adminLoading, isAdmin, navigate]);

  const openProjects = async (u: AdminUser) => {
    setProjectsUser(u);
    setProjectsLoading(true);
    try {
      const res = await callAdmin<{ projects: UserProject[] }>({
        action: "list_user_projects",
        userId: u.id,
      });
      setProjects(res.projects);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "No pudimos cargar los proyectos"));
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newEmail || newPassword.length < 8) {
      toast.error("Correo válido y contraseña de al menos 8 caracteres");
      return;
    }
    setBusy(true);
    try {
      await callAdmin({
        action: "create",
        email: newEmail.trim(),
        password: newPassword,
        fullName: newName.trim(),
      });
      toast.success("Cuenta creada");
      setCreateOpen(false);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "No pudimos crear la cuenta"));
    } finally {
      setBusy(false);
    }
  };

  const handleSetPassword = async () => {
    if (!pwUser || pwValue.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setBusy(true);
    try {
      await callAdmin({ action: "set_password", userId: pwUser.id, password: pwValue });
      toast.success("Contraseña actualizada");
      setPwUser(null);
      setPwValue("");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "No pudimos cambiar la contraseña"));
    } finally {
      setBusy(false);
    }
  };

  const handleSendReset = async (u: AdminUser) => {
    if (!u.email) return;
    setBusy(true);
    try {
      await callAdmin({
        action: "send_reset",
        email: u.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      toast.success("Correo de restablecimiento enviado");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "No pudimos enviar el correo"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!delUser || delConfirm.trim().toLowerCase() !== (delUser.email ?? "").toLowerCase()) {
      toast.error("Escribe el correo exacto para confirmar");
      return;
    }
    setBusy(true);
    try {
      await callAdmin({ action: "delete", userId: delUser.id });
      toast.success("Usuario eliminado");
      setDelUser(null);
      setDelConfirm("");
      load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "No pudimos eliminar el usuario"));
    } finally {
      setBusy(false);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Usuarios</h1>
              <p className="text-muted-foreground">
                Administración de cuentas y proyectos de la plataforma
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Agregar usuario
          </Button>
        </div>

        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Personas ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center">Aún no hay usuarios.</p>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 rounded-lg bg-secondary/30 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{u.fullName || u.email}</p>
                      {u.roles.includes("admin") && (
                        <Badge variant="outline" className="text-primary border-primary/40">
                          Super usuario
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Alta {fmt(u.createdAt)} · Último acceso {fmt(u.lastSignInAt)} ·{" "}
                      {u.projectCount} proyecto{u.projectCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => openProjects(u)}>
                      <FolderOpen className="w-4 h-4 mr-1.5" />
                      Proyectos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPwUser(u)}>
                      <KeyRound className="w-4 h-4 mr-1.5" />
                      Contraseña
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleSendReset(u)}
                    >
                      <Mail className="w-4 h-4 mr-1.5" />
                      Enviar enlace
                    </Button>
                    {!u.isSelf && !u.roles.includes("admin") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDelUser(u)}
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create user */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Agregar usuario</DialogTitle>
            <DialogDescription>
              La cuenta queda activa de inmediato con la contraseña que definas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cu-name">Nombre</Label>
              <Input id="cu-name" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-email">Correo</Label>
              <Input
                id="cu-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-pass">Contraseña inicial</Label>
              <Input
                id="cu-pass"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                maxLength={72}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set password */}
      <Dialog open={!!pwUser} onOpenChange={(o) => !o && setPwUser(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nueva contraseña</DialogTitle>
            <DialogDescription>
              Define la contraseña de {pwUser?.email} y compártesela de forma segura.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="pw-value">Contraseña</Label>
            <Input
              id="pw-value"
              type="text"
              value={pwValue}
              onChange={(e) => setPwValue(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              maxLength={72}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSetPassword} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete user */}
      <Dialog open={!!delUser} onOpenChange={(o) => !o && setDelUser(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription>
              Se eliminarán también sus proyectos y archivos. Escribe{" "}
              <span className="font-medium text-foreground">{delUser?.email}</span> para confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={delConfirm}
              onChange={(e) => setDelConfirm(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelUser(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User projects */}
      <Dialog open={!!projectsUser} onOpenChange={(o) => !o && setProjectsUser(null)}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proyectos de {projectsUser?.fullName || projectsUser?.email}</DialogTitle>
            <DialogDescription>Vista de solo lectura.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            {projectsLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : projects.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center">
                Esta persona no tiene proyectos.
              </p>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="rounded-lg bg-secondary/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{p.name}</p>
                    <div className="flex gap-1.5 shrink-0">
                      {p.is_public && <Badge variant="outline">Público</Badge>}
                      {p.status && <Badge variant="secondary">{p.status}</Badge>}
                    </div>
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Creado {fmt(p.created_at)} · Actualizado {fmt(p.updated_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
