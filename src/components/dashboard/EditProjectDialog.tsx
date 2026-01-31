import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X, Plus, Globe } from "lucide-react";
import { Project, UpdateProjectData } from "@/hooks/useProjects";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AVAILABLE_TECHNOLOGIES = [
  "React", "TypeScript", "Tailwind CSS", "Supabase", "Vite",
  "Node.js", "PostgreSQL", "Framer Motion", "Shadcn/ui"
];

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSubmit: (id: string, data: UpdateProjectData) => Promise<any>;
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
}: EditProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [isPublic, setIsPublic] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [newTech, setNewTech] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setStatus(project.status || "active");
      setIsPublic(project.is_public || false);
      setPreviewUrl(project.preview_url || "");
      setThumbnailUrl(project.thumbnail_url || "");
      setTechnologies(project.technologies || []);
    }
  }, [project]);

  const validate = () => {
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = "El nombre es requerido";
    } else if (name.length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    } else if (name.length > 50) {
      newErrors.name = "El nombre no puede exceder 50 caracteres";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !validate()) return;

    setLoading(true);
    const result = await onSubmit(project.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      is_public: isPublic,
      preview_url: previewUrl.trim() || undefined,
      thumbnail_url: thumbnailUrl.trim() || undefined,
      technologies: technologies.length > 0 ? technologies : undefined,
    });
    setLoading(false);

    if (result) {
      setErrors({});
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onOpenChange(false);
  };

  const addTechnology = (tech: string) => {
    if (tech && !technologies.includes(tech)) {
      setTechnologies([...technologies, tech]);
    }
    setNewTech("");
  };

  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Editar proyecto</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Modifica la información de tu proyecto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre del proyecto *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi proyecto"
              className="bg-secondary/50 border-border"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu proyecto..."
              className="bg-secondary/50 border-border min-h-[100px]"
              maxLength={500}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Estado</Label>
            <Select value={status} onValueChange={setStatus} disabled={loading}>
              <SelectTrigger className="bg-secondary/50 border-border">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Public visibility section */}
          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">Visibilidad pública</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-public">Mostrar en portfolio</Label>
                <p className="text-xs text-muted-foreground">
                  Tu proyecto será visible en la página principal
                </p>
              </div>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={loading}
              />
            </div>

            {isPublic && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="preview-url">URL del sitio</Label>
                  <Input
                    id="preview-url"
                    value={previewUrl}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                    placeholder="https://mi-proyecto.lovable.app"
                    className="bg-secondary/50 border-border"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail-url">URL de captura de pantalla</Label>
                  <Input
                    id="thumbnail-url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://ejemplo.com/captura.png"
                    className="bg-secondary/50 border-border"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tecnologías</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {technologies.map((tech) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTechnology(tech)}
                          className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value=""
                      onValueChange={(value) => addTechnology(value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-secondary/50 border-border flex-1">
                        <SelectValue placeholder="Agregar tecnología..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {AVAILABLE_TECHNOLOGIES.filter(
                          (t) => !technologies.includes(t)
                        ).map((tech) => (
                          <SelectItem key={tech} value={tech}>
                            {tech}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      placeholder="Otra tecnología..."
                      className="bg-secondary/50 border-border flex-1"
                      disabled={loading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTechnology(newTech);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => addTechnology(newTech)}
                      disabled={loading || !newTech.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {project && (
            <div className="pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Creado:</span>{" "}
                  {project.created_at
                    ? format(new Date(project.created_at), "PPP", { locale: es })
                    : "N/A"}
                </div>
                <div>
                  <span className="font-medium">Actualizado:</span>{" "}
                  {project.updated_at
                    ? format(new Date(project.updated_at), "PPP", { locale: es })
                    : "N/A"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
