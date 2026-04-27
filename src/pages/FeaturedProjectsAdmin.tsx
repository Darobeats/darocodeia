import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, ArrowUp, ArrowDown, Pencil, Trash2, Plus, Upload, Star } from "lucide-react";
import { toast } from "sonner";

interface FeaturedProject {
  id: string;
  name: string;
  description: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  technologies: string[] | null;
  is_public: boolean | null;
  featured_order: number | null;
  user_id: string;
}

const emptyForm = {
  name: "",
  description: "",
  preview_url: "",
  thumbnail_url: "",
  technologies: "",
};

export default function FeaturedProjectsAdmin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [projects, setProjects] = useState<FeaturedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FeaturedProject | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<FeaturedProject | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin && user) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, user, navigate]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, description, preview_url, thumbnail_url, technologies, is_public, featured_order, user_id")
      .eq("is_public", true)
      .order("featured_order", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Error al cargar proyectos");
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchProjects();
  }, [isAdmin]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: FeaturedProject) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      preview_url: p.preview_url || "",
      thumbnail_url: p.thumbnail_url || "",
      technologies: (p.technologies || []).join(", "),
    });
    setDialogOpen(true);
  };

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("public-assets")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("public-assets").getPublicUrl(path);
      setForm((f) => ({ ...f, thumbnail_url: data.publicUrl }));
      toast.success("Imagen subida");
    } catch (e: any) {
      toast.error(e.message || "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    const technologies = form.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      preview_url: form.preview_url.trim() || null,
      thumbnail_url: form.thumbnail_url.trim() || null,
      technologies,
      is_public: true,
    };
    try {
      if (editing) {
        const { error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Proyecto actualizado");
      } else {
        const maxOrder = projects.reduce(
          (m, p) => Math.max(m, p.featured_order || 0),
          0,
        );
        const { error } = await supabase.from("projects").insert({
          ...payload,
          user_id: user.id,
          featured_order: maxOrder + 1,
          status: "active",
        });
        if (error) throw error;
        toast.success("Proyecto destacado creado");
      }
      setDialogOpen(false);
      fetchProjects();
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: FeaturedProject) => {
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Proyecto eliminado");
      fetchProjects();
    }
    setConfirmDelete(null);
  };

  const handleTogglePublic = async (p: FeaturedProject) => {
    const { error } = await supabase
      .from("projects")
      .update({ is_public: !p.is_public })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else fetchProjects();
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= projects.length) return;
    const a = projects[index];
    const b = projects[target];
    const orderA = a.featured_order ?? index + 1;
    const orderB = b.featured_order ?? target + 1;
    // Swap
    const { error: e1 } = await supabase
      .from("projects")
      .update({ featured_order: orderB })
      .eq("id", a.id);
    const { error: e2 } = await supabase
      .from("projects")
      .update({ featured_order: orderA })
      .eq("id", b.id);
    if (e1 || e2) toast.error("Error al reordenar");
    else fetchProjects();
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-lg">Proyectos Destacados</h1>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Agregar
        </Button>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {loading ? (
          <p className="text-muted-foreground text-center py-12">Cargando proyectos…</p>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay proyectos destacados todavía.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map((p, i) => (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                        {p.thumbnail_url ? (
                          <img
                            src={p.thumbnail_url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin imagen</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{p.name}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {p.description || "Sin descripción"}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            #{p.featured_order ?? "—"}
                          </Badge>
                          {(p.technologies || []).slice(0, 3).map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMove(i, -1)}
                        disabled={i === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMove(i, 1)}
                        disabled={i === projects.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDelete(p)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!p.is_public}
                      onCheckedChange={() => handleTogglePublic(p)}
                    />
                    <span className="text-muted-foreground">
                      {p.is_public ? "Visible en portfolio" : "Oculto"}
                    </span>
                  </div>
                  {p.preview_url && (
                    <a
                      href={p.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate max-w-[50%]"
                    >
                      {p.preview_url}
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar proyecto destacado" : "Nuevo proyecto destacado"}
            </DialogTitle>
            <DialogDescription>
              Estos datos se muestran en el portfolio público de la página principal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="preview_url">URL del proyecto</Label>
              <Input
                id="preview_url"
                placeholder="https://ejemplo.com"
                value={form.preview_url}
                onChange={(e) => setForm({ ...form, preview_url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="thumbnail">Miniatura</Label>
              <div className="flex gap-2">
                <Input
                  id="thumbnail"
                  placeholder="URL de la imagen"
                  value={form.thumbnail_url}
                  onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                />
                <Button variant="outline" asChild disabled={uploading}>
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Subiendo…" : "Subir"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f);
                      }}
                    />
                  </label>
                </Button>
              </div>
              {form.thumbnail_url && (
                <img
                  src={form.thumbnail_url}
                  alt="preview"
                  className="mt-2 h-24 rounded border border-border object-cover"
                />
              )}
            </div>
            <div>
              <Label htmlFor="tech">Tecnologías (separadas por coma)</Label>
              <Input
                id="tech"
                placeholder="React, Tailwind, Supabase"
                value={form.technologies}
                onChange={(e) => setForm({ ...form, technologies: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará "{confirmDelete?.name}" del portfolio público de forma
              permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </Dialog>
    </div>
  );
}
