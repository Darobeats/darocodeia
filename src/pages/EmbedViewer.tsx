import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Copy, ArrowRight, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function EmbedViewer() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract URL from path after /view/
  const pathUrl = location.pathname.replace(/^\/view\/?/, "");
  const targetUrl = pathUrl && isValidUrl(decodeURIComponent(pathUrl)) ? decodeURIComponent(pathUrl) : pathUrl && isValidUrl(pathUrl) ? pathUrl : "";

  const [inputUrl, setInputUrl] = useState(targetUrl || "");
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (targetUrl) {
      setInputUrl(targetUrl);
      setIframeError(false);
    }
  }, [targetUrl]);

  const handleGo = () => {
    const url = inputUrl.trim();
    if (!url) return;
    const finalUrl = !url.startsWith("http") ? `https://${url}` : url;
    if (!isValidUrl(finalUrl)) {
      toast.error("URL inválida. Usa formato: https://ejemplo.com");
      return;
    }
    navigate(`/view/${encodeURIComponent(finalUrl)}`);
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/view/${encodeURIComponent(targetUrl)}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Enlace copiado al portapapeles");
  };

  // Landing state - no URL provided
  if (!targetUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Visor de sitios web</h1>
          <p className="text-muted-foreground">
            Ingresa un enlace para abrirlo dentro de DaroCode. Podrás compartir el enlace con otros.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://ejemplo.com"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGo()}
              className="flex-1"
            />
            <Button onClick={handleGo}>
              <ArrowRight className="w-4 h-4 mr-1" /> Abrir
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Algunos sitios bloquean la visualización en marcos externos.
          </p>
        </div>
      </div>
    );
  }

  // Embed state
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card shrink-0">
        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGo()}
          className="flex-1 h-8 text-sm"
        />
        <Button size="sm" onClick={handleGo}>Ir</Button>
        <Button size="sm" variant="outline" onClick={handleCopyShareLink}>
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <a href={targetUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Button>
      </div>

      {/* Iframe */}
      {iframeError ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="space-y-3">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
            <p className="text-foreground font-medium">No se pudo cargar este sitio</p>
            <p className="text-sm text-muted-foreground">
              El sitio bloquea la visualización en marcos externos (X-Frame-Options / CSP).
            </p>
            <Button variant="outline" asChild>
              <a href={targetUrl} target="_blank" rel="noopener noreferrer">
                Abrir en nueva pestaña <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <iframe
          src={targetUrl}
          className="flex-1 w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onError={() => setIframeError(true)}
          title="Embedded website"
        />
      )}
    </div>
  );
}
