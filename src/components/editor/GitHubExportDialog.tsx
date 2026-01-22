import { useState } from "react";
import { useGitHub } from "@/hooks/useGitHub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Github,
  Loader2,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectFile {
  id: string;
  file_path: string;
  content: string | null;
  language: string | null;
}

interface GitHubExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectDescription?: string;
  files: ProjectFile[];
}

export default function GitHubExportDialog({
  isOpen,
  onClose,
  projectName,
  projectDescription,
  files,
}: GitHubExportDialogProps) {
  const {
    connection,
    isConnected,
    loading,
    isPushing,
    initiateOAuth,
    disconnect,
    pushToGitHub,
  } = useGitHub();

  const [repoName, setRepoName] = useState(
    projectName.toLowerCase().replace(/\s+/g, "-")
  );
  const [description, setDescription] = useState(projectDescription || "");
  const [isPrivate, setIsPrivate] = useState(true);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      await initiateOAuth();
    } catch (error) {
      console.error("OAuth error:", error);
      toast.error("Error al conectar con GitHub");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success("Desconectado de GitHub");
    } catch {
      toast.error("Error al desconectar");
    }
  };

  const handlePush = async () => {
    if (!repoName.trim()) {
      toast.error("El nombre del repositorio es requerido");
      return;
    }

    try {
      // Prepare files for push
      const filesToPush = files
        .filter((f) => f.content)
        .map((f) => ({
          path: f.file_path,
          content: f.content || "",
        }));

      // Add README
      filesToPush.push({
        path: "README.md",
        content: `# ${projectName}

${description || "Proyecto creado con DaroCode."}

## Instalación

\`\`\`bash
npm install
npm run dev
\`\`\`

## Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
`,
      });

      const result = await pushToGitHub({
        repoName: repoName.trim(),
        isPrivate,
        description: description.trim() || undefined,
        files: filesToPush,
      });

      setRepoUrl(result.html_url);
      toast.success("¡Proyecto subido a GitHub!");
    } catch (error) {
      console.error("Push error:", error);
      toast.error("Error al subir a GitHub");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Subir a GitHub
          </DialogTitle>
          <DialogDescription>
            Crea un repositorio en GitHub con todos los archivos de tu proyecto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Connection Status */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !isConnected ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
                <Github className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">Conecta tu cuenta de GitHub</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Necesitas conectar tu cuenta para subir proyectos
                </p>
              </div>
              <Button onClick={handleConnect} className="gap-2">
                <Github className="w-4 h-4" />
                Conectar con GitHub
              </Button>

              {/* Note about OAuth */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Para usar esta función, el administrador debe configurar una
                  GitHub OAuth App con las variables GITHUB_CLIENT_ID y
                  GITHUB_CLIENT_SECRET.
                </p>
              </div>
            </div>
          ) : repoUrl ? (
            // Success State
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium">¡Repositorio creado!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu proyecto ha sido subido exitosamente
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(repoUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                Ver en GitHub
              </Button>
            </div>
          ) : (
            // Form
            <>
              {/* Connected Account */}
              <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Github className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      @{connection?.github_username}
                    </p>
                    <p className="text-xs text-muted-foreground">Conectado</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-muted-foreground"
                >
                  <Unlink className="w-4 h-4" />
                </Button>
              </div>

              {/* Repository Name */}
              <div className="space-y-2">
                <Label htmlFor="repoName">Nombre del repositorio</Label>
                <Input
                  id="repoName"
                  placeholder="mi-proyecto"
                  value={repoName}
                  onChange={(e) =>
                    setRepoName(
                      e.target.value.toLowerCase().replace(/\s+/g, "-")
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  github.com/{connection?.github_username}/{repoName || "..."}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción del repositorio..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Visibility */}
              <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">
                    {isPrivate ? "Repositorio privado" : "Repositorio público"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPrivate
                      ? "Solo tú podrás ver este repositorio"
                      : "Cualquiera podrá ver este repositorio"}
                  </p>
                </div>
                <Switch checked={!isPrivate} onCheckedChange={(v) => setIsPrivate(!v)} />
              </div>

              {/* Files Count */}
              <div className="text-sm text-muted-foreground">
                Se subirán {files.filter((f) => f.content).length} archivos
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {repoUrl ? "Cerrar" : "Cancelar"}
          </Button>
          {isConnected && !repoUrl && (
            <Button onClick={handlePush} disabled={isPushing || !repoName.trim()}>
              {isPushing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Github className="w-4 h-4 mr-2" />
                  Crear y subir
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
