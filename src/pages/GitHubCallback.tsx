import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGitHub } from "@/hooks/useGitHub";
import { Loader2, CheckCircle2, XCircle, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GitHubCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useGitHub();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    if (oauthError) {
      setStatus("error");
      setErrorMsg(params.get("error_description") || oauthError);
      return;
    }
    if (!code || !state) {
      setStatus("error");
      setErrorMsg("Faltan parámetros de OAuth (code/state).");
      return;
    }

    handleOAuthCallback(code, state)
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/dashboard/projects"), 1500);
      })
      .catch((err: any) => {
        console.error("GitHub OAuth callback error:", err);
        setStatus("error");
        setErrorMsg(err?.message || "No se pudo completar la conexión con GitHub.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-4 p-8 border border-border rounded-lg bg-card">
        <Github className="w-12 h-12 mx-auto text-muted-foreground" />
        {status === "loading" && (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <h2 className="text-lg font-semibold">Conectando con GitHub…</h2>
            <p className="text-sm text-muted-foreground">Esto solo tomará unos segundos.</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-8 h-8 mx-auto text-green-500" />
            <h2 className="text-lg font-semibold">¡Conectado!</h2>
            <p className="text-sm text-muted-foreground">Redirigiendo a tus proyectos…</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-8 h-8 mx-auto text-destructive" />
            <h2 className="text-lg font-semibold">Error al conectar</h2>
            <p className="text-sm text-muted-foreground break-words">{errorMsg}</p>
            <Button onClick={() => navigate("/dashboard/projects")}>Volver</Button>
          </>
        )}
      </div>
    </div>
  );
}
