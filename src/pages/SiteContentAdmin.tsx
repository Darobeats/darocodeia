import { getErrorMessage } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  ArrowLeft,
  Eye,
  Loader2,
  Rocket,
  Save,
  Star,
  Undo2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { SITE_SECTIONS, SiteField, fieldSection } from "@/data/siteContentSchema";
import { SiteContentRow } from "@/hooks/useSiteContent";
import { useLanguage } from "@/i18n/LanguageContext";

type Draft = Record<string, { es: string; en: string }>;

export default function SiteContentAdmin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [rows, setRows] = useState<SiteContentRow[]>([]);
  const [draft, setDraft] = useState<Draft>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Solo el super usuario puede editar la página");
      navigate("/dashboard");
    }
  }, [roleLoading, isAdmin, navigate]);

  const defaultFor = (field: SiteField, lang: "es" | "en") => {
    if (field.i18nKey) return t(field.i18nKey);
    return (lang === "en" ? field.defaultEn : field.defaultEs) ?? "";
  };

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("site_content").select("*");
      if (!active) return;
      if (error) {
        toast.error(getErrorMessage(error, "No se pudo cargar el contenido"));
      } else {
        const list = (data || []) as SiteContentRow[];
        setRows(list);
        const next: Draft = {};
        SITE_SECTIONS.forEach((section) =>
          section.fields.forEach((field) => {
            const row = list.find((r) => r.key === field.key);
            next[field.key] = {
              es: row?.draft_es ?? row?.value_es ?? "",
              en: row?.draft_en ?? row?.value_en ?? "",
            };
          })
        );
        setDraft(next);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const pendingCount = useMemo(() => {
    return Object.entries(draft).filter(([key, value]) => {
      const row = rows.find((r) => r.key === key);
      return (value.es || "") !== (row?.value_es || "") || (value.en || "") !== (row?.value_en || "");
    }).length;
  }, [draft, rows]);

  const setValue = (key: string, lang: "es" | "en", value: string) => {
    setDraft((prev) => ({
      ...prev,
      [key]: { es: lang === "es" ? value : prev[key]?.es ?? "", en: lang === "en" ? value : prev[key]?.en ?? "" },
    }));
  };

  const payload = () =>
    Object.entries(draft).map(([key, value]) => {
      const row = rows.find((r) => r.key === key);
      const field = SITE_SECTIONS.flatMap((s) => s.fields).find((f) => f.key === key);
      return {
        key,
        type: field?.type ?? "text",
        section: fieldSection(key),
        label: field?.label ?? null,
        value_es: row?.value_es ?? null,
        value_en: row?.value_en ?? null,
        draft_es: value.es || null,
        draft_en: value.en || null,
        published_at: row?.published_at ?? null,
        updated_by: user?.id ?? null,
      };
    });

  const reload = async () => {
    const { data } = await supabase.from("site_content").select("*");
    setRows((data || []) as SiteContentRow[]);
    queryClient.invalidateQueries({ queryKey: ["site_content"] });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_content").upsert(payload(), { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error(getErrorMessage(error, "No se pudo guardar el borrador"));
      return;
    }
    await reload();
    toast.success("Borrador guardado");
  };

  const handlePublish = async () => {
    setPublishing(true);
    const now = new Date().toISOString();
    const rowsToSave = payload().map((row) => ({
      ...row,
      value_es: row.draft_es,
      value_en: row.draft_en,
      published_at: now,
    }));
    const { error } = await supabase.from("site_content").upsert(rowsToSave, { onConflict: "key" });
    setPublishing(false);
    if (error) {
      toast.error(getErrorMessage(error, "No se pudo publicar"));
      return;
    }
    await reload();
    toast.success("Cambios publicados en la página");
  };

  const handleDiscard = async () => {
    setConfirmDiscard(false);
    const next: Draft = {};
    Object.keys(draft).forEach((key) => {
      const row = rows.find((r) => r.key === key);
      next[key] = { es: row?.value_es ?? "", en: row?.value_en ?? "" };
    });
    setDraft(next);
    const { error } = await supabase
      .from("site_content")
      .upsert(
        Object.entries(next).map(([key, value]) => {
          const row = rows.find((r) => r.key === key);
          const field = SITE_SECTIONS.flatMap((s) => s.fields).find((f) => f.key === key);
          return {
            key,
            type: field?.type ?? "text",
            section: fieldSection(key),
            label: field?.label ?? null,
            value_es: row?.value_es ?? null,
            value_en: row?.value_en ?? null,
            draft_es: value.es || null,
            draft_en: value.en || null,
            published_at: row?.published_at ?? null,
            updated_by: user?.id ?? null,
          };
        }),
        { onConflict: "key" }
      );
    if (error) {
      toast.error(getErrorMessage(error, "No se pudo descartar el borrador"));
      return;
    }
    await reload();
    toast.success("Borrador descartado");
  };

  const handleUpload = async (key: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede pesar más de 5 MB");
      return;
    }
    setUploadingKey(key);
    const ext = file.name.split(".").pop() || "png";
    const path = `site/${key.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("public-assets").upload(path, file, { upsert: true });
    if (error) {
      setUploadingKey(null);
      toast.error(getErrorMessage(error, "No se pudo subir la imagen"));
      return;
    }
    const { data } = supabase.storage.from("public-assets").getPublicUrl(path);
    setValue(key, "es", data.publicUrl);
    setValue(key, "en", data.publicUrl);
    setUploadingKey(null);
    toast.success("Imagen lista. Recuerda guardar y publicar.");
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="container px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Contenido del sitio</h1>
              <p className="text-sm text-muted-foreground">
                Edita textos, enlaces e imágenes de la página pública
              </p>
            </div>
            {pendingCount > 0 && (
              <Badge variant="secondary">{pendingCount} sin publicar</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/featured">
                <Star className="w-4 h-4 mr-2" />
                Proyectos destacados
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/?preview=draft" target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4 mr-2" />
                Vista previa
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirmDiscard(true)}>
              <Undo2 className="w-4 h-4 mr-2" />
              Descartar
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSaveDraft} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar borrador
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={publishing}>
              {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
              Publicar
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <Tabs defaultValue={SITE_SECTIONS[0].id}>
          <TabsList className="flex flex-wrap h-auto">
            {SITE_SECTIONS.map((section) => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {SITE_SECTIONS.map((section) => (
            <TabsContent key={section.id} value={section.id} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.fields.map((field) => (
                    <div key={field.key} className="space-y-2 pb-4 border-b border-border/50 last:border-0">
                      <Label className="text-sm font-medium">{field.label}</Label>
                      {field.type === "image" ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          {draft[field.key]?.es ? (
                            <img
                              src={draft[field.key].es}
                              alt={field.label}
                              className="h-16 w-28 object-contain rounded-md border border-border bg-muted/40"
                            />
                          ) : (
                            <div className="h-16 w-28 rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                              Sin imagen
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild disabled={uploadingKey === field.key}>
                              <label className="cursor-pointer">
                                {uploadingKey === field.key ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4 mr-2" />
                                )}
                                Subir imagen
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(field.key, file);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                            </Button>
                            <Input
                              value={draft[field.key]?.es ?? ""}
                              onChange={(e) => {
                                setValue(field.key, "es", e.target.value);
                                setValue(field.key, "en", e.target.value);
                              }}
                              placeholder="O pega una URL de imagen"
                              className="w-64"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                          {(["es", "en"] as const).map((lang) => (
                            <div key={lang} className="space-y-1">
                              <span className="text-xs text-muted-foreground uppercase">
                                {lang === "es" ? "Español" : "English"}
                              </span>
                              {field.multiline ? (
                                <Textarea
                                  value={draft[field.key]?.[lang] ?? ""}
                                  onChange={(e) => setValue(field.key, lang, e.target.value)}
                                  placeholder={defaultFor(field, lang)}
                                  className="min-h-[80px]"
                                  maxLength={1000}
                                />
                              ) : (
                                <Input
                                  value={draft[field.key]?.[lang] ?? ""}
                                  onChange={(e) => setValue(field.key, lang, e.target.value)}
                                  placeholder={defaultFor(field, lang)}
                                  maxLength={400}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Si lo dejas vacío se usa el texto original de la página.
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar el borrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Volverás a los textos que están publicados ahora mismo. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
