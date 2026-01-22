import { useState, useEffect } from "react";
import { useSnippets, Snippet } from "@/hooks/useSnippets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Code, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SaveSnippetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode: string;
  editingSnippet: Snippet | null;
}

const LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "tsx", label: "TSX" },
  { value: "jsx", label: "JSX" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "json", label: "JSON" },
  { value: "sql", label: "SQL" },
  { value: "markdown", label: "Markdown" },
];

export default function SaveSnippetDialog({
  isOpen,
  onClose,
  initialCode,
  editingSnippet,
}: SaveSnippetDialogProps) {
  const { createSnippet, updateSnippet } = useSnippets();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingSnippet) {
      setTitle(editingSnippet.title);
      setDescription(editingSnippet.description || "");
      setCode(editingSnippet.code);
      setLanguage(editingSnippet.language);
      setTags(editingSnippet.tags);
      setIsPublic(editingSnippet.is_public);
    } else {
      setTitle("");
      setDescription("");
      setCode(initialCode);
      setLanguage("typescript");
      setTags([]);
      setIsPublic(false);
    }
  }, [editingSnippet, initialCode, isOpen]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !code.trim()) {
      toast.error("Título y código son requeridos");
      return;
    }

    setSaving(true);

    try {
      if (editingSnippet) {
        await updateSnippet(editingSnippet.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          code: code.trim(),
          language,
          tags,
          is_public: isPublic,
        });
        toast.success("Snippet actualizado");
      } else {
        await createSnippet({
          title: title.trim(),
          description: description.trim() || undefined,
          code: code.trim(),
          language,
          tags,
          is_public: isPublic,
        });
        toast.success("Snippet guardado");
      }
      onClose();
    } catch {
      toast.error("Error al guardar snippet");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            {editingSnippet ? "Editar Snippet" : "Guardar Snippet"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ej: Navbar responsive con Tailwind"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Breve descripción del snippet..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Código *</Label>
            <Textarea
              id="code"
              placeholder="Pega tu código aquí..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* Language and Public */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lenguaje</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibilidad</Label>
              <div className="flex items-center justify-between bg-secondary/30 rounded-md px-3 py-2.5">
                <span className="text-sm">
                  {isPublic ? "Público" : "Privado"}
                </span>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Etiquetas (máx. 5)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Agregar etiqueta..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={tags.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 5}
              >
                Agregar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : editingSnippet ? (
              "Actualizar"
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
