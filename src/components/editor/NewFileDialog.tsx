import { useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCode, Image, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onFileCreated: (filePath: string, content: string, isImage?: boolean) => void;
}

export function NewFileDialog({
  open,
  onOpenChange,
  projectId,
  onFileCreated,
}: NewFileDialogProps) {
  const [activeTab, setActiveTab] = useState<"file" | "image">("file");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateFile = async () => {
    if (!fileName.trim()) {
      toast.error("El nombre del archivo es requerido");
      return;
    }

    const filePath = fileName.startsWith("src/") ? fileName : `src/${fileName}`;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("project_files")
        .insert({
          project_id: projectId,
          file_path: filePath,
          content: getDefaultContent(filePath),
          language: getLanguageFromPath(filePath),
        });

      if (error) throw error;

      onFileCreated(filePath, getDefaultContent(filePath));
      toast.success("Archivo creado exitosamente");
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Error al crear el archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5MB");
      return;
    }

    setLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${projectId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("project-assets")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("project-assets")
        .getPublicUrl(fileName);

      // Save as reference image in project_files
      const refPath = `references/${file.name}`;
      const { error: dbError } = await supabase
        .from("project_files")
        .insert({
          project_id: projectId,
          file_path: refPath,
          content: publicUrl,
          language: "image",
        });

      if (dbError) throw dbError;

      onFileCreated(refPath, publicUrl, true);
      toast.success("Imagen subida exitosamente. Puedes referenciarla en tus prompts.");
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Error al subir la imagen");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleClose = () => {
    setFileName("");
    setActiveTab("file");
    onOpenChange(false);
  };

  const getDefaultContent = (path: string): string => {
    if (path.endsWith(".tsx")) {
      const componentName = path.split("/").pop()?.replace(".tsx", "") || "Component";
      return `export function ${componentName}() {\n  return (\n    <div>\n      {/* Tu código aquí */}\n    </div>\n  );\n}`;
    }
    if (path.endsWith(".css")) {
      return "/* Estilos */\n";
    }
    if (path.endsWith(".ts")) {
      return "// Tu código aquí\n";
    }
    return "";
  };

  const getLanguageFromPath = (path: string): string => {
    if (path.endsWith(".tsx")) return "typescript";
    if (path.endsWith(".ts")) return "typescript";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".html")) return "html";
    return "plaintext";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Agregar archivo</DialogTitle>
          <DialogDescription>
            Crea un archivo vacío o sube una imagen de referencia para tu diseño.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "file" | "image")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Archivo vacío
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Imagen de diseño
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">Ruta del archivo</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="src/components/MiComponente.tsx"
                className="bg-secondary/50 border-border"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Ejemplos: src/components/Header.tsx, src/styles/main.css
              </p>
            </div>
          </TabsContent>

          <TabsContent value="image" className="mt-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Arrastra una imagen aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG o WebP. Máximo 5MB.
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              💡 Sube un diseño o mockup y menciona "basándote en la imagen" en tu prompt
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          {activeTab === "file" && (
            <Button onClick={handleCreateFile} disabled={loading || !fileName.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear archivo"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
