import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useGitHub } from "@/hooks/useGitHub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Github, Loader2, Search, Lock, GitBranch } from "lucide-react";
import { toast } from "sonner";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  default_branch: string;
  updated_at: string;
  language: string | null;
  html_url: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportFromGitHubDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { isConnected, loading: connLoading, initiateOAuth } = useGitHub();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [search, setSearch] = useState("");
  const [importingId, setImportingId] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !isConnected) return;
    setLoadingRepos(true);
    supabase.functions
      .invoke("github-list-repos")
      .then(({ data, error }) => {
        if (error) throw error;
        setRepos(data?.repos ?? []);
      })
      .catch((err) => {
        console.error(err);
        toast.error("No se pudieron cargar los repositorios");
      })
      .finally(() => setLoadingRepos(false));
  }, [open, isConnected]);

  const filtered = useMemo(() => {
    if (!search) return repos;
    const s = search.toLowerCase();
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(s) ||
        r.full_name.toLowerCase().includes(s) ||
        (r.description && r.description.toLowerCase().includes(s))
    );
  }, [repos, search]);

  const handleImport = async (repo: Repo) => {
    setImportingId(repo.id);
    try {
      const [owner, name] = repo.full_name.split("/");
      const { data, error } = await supabase.functions.invoke("github-import", {
        body: { owner, repo: name, branch: repo.default_branch },
      });
      if (error) throw error;
      toast.success(`Importado: ${data.files_imported} archivos`);
      onOpenChange(false);
      navigate(`/dashboard/projects/${data.project_id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error al importar el repositorio");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Importar desde GitHub
          </DialogTitle>
          <DialogDescription>
            Selecciona un repositorio para analizarlo y mejorarlo con IA.
          </DialogDescription>
        </DialogHeader>

        {connLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isConnected ? (
          <div className="flex flex-col items-center text-center py-10 gap-4">
            <Github className="w-12 h-12 text-muted-foreground" />
            <div>
              <h3 className="font-medium">Conecta tu cuenta de GitHub</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Necesitamos permisos para listar e importar tus repositorios de forma segura.
              </p>
            </div>
            <Button
              onClick={async () => {
                try {
                  await initiateOAuth();
                } catch (err: any) {
                  toast.error(
                    err?.message ||
                      "GitHub OAuth no está configurado. Pide al administrador agregar VITE_GITHUB_CLIENT_ID."
                  );
                }
              }}
            >
              <Github className="w-4 h-4 mr-2" />
              Conectar GitHub
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar repositorios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex-1 overflow-y-auto -mx-2 px-2 mt-2">
              {loadingRepos ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">
                  No se encontraron repositorios
                </p>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((repo) => (
                    <li
                      key={repo.id}
                      className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-secondary/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{repo.name}</span>
                          {repo.private && (
                            <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                          )}
                          {repo.language && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              · {repo.language}
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <GitBranch className="w-3 h-3" />
                          {repo.default_branch}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleImport(repo)}
                        disabled={importingId !== null}
                      >
                        {importingId === repo.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Importar"
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
