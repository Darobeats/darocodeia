import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Link2, X, Palette, Type, Globe } from "lucide-react";
import { ScrapedWebsite } from "@/lib/api/firecrawl";

export type DuplicationMode = "structure" | "content" | "full";

interface UrlPreviewCardProps {
  url: string;
  isLoading: boolean;
  scrapedData: ScrapedWebsite | null;
  onDuplicate: (mode: DuplicationMode) => void;
  onCancel: () => void;
}

export default function UrlPreviewCard({
  url,
  isLoading,
  scrapedData,
  onDuplicate,
  onCancel,
}: UrlPreviewCardProps) {
  const [mode, setMode] = useState<DuplicationMode>("full");

  const colors = scrapedData?.branding?.colors;
  const colorsList = colors
    ? Object.entries(colors)
        .filter(([_, value]) => value)
        .slice(0, 5)
    : [];

  const fonts = scrapedData?.branding?.fonts?.map((f) => f.family).slice(0, 3) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-card border border-border rounded-lg p-4 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">URL detectada</p>
            <p className="text-xs text-muted-foreground truncate max-w-[280px]">{url}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analizando página...</p>
        </div>
      ) : scrapedData ? (
        <>
          {/* Preview Section */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Screenshot thumbnail */}
            {scrapedData.screenshot && (
              <div className="col-span-2 sm:col-span-1">
                <div className="aspect-video rounded-lg overflow-hidden bg-secondary/50 border border-border">
                  <img
                    src={`data:image/png;base64,${scrapedData.screenshot}`}
                    alt="Page preview"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            )}

            {/* Extracted info */}
            <div className={`space-y-3 ${scrapedData.screenshot ? 'col-span-2 sm:col-span-1' : 'col-span-2'}`}>
              {/* Title */}
              {scrapedData.metadata?.title && (
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm font-medium line-clamp-2">{scrapedData.metadata.title}</p>
                </div>
              )}

              {/* Colors */}
              {colorsList.length > 0 && (
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex items-center gap-1">
                    {colorsList.map(([key, value]) => (
                      <div
                        key={key}
                        className="w-5 h-5 rounded-full border border-border"
                        style={{ backgroundColor: value as string }}
                        title={`${key}: ${value}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Fonts */}
              {fonts.length > 0 && (
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">{fonts.join(", ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Duplication Mode */}
          <div className="space-y-3 mb-4">
            <p className="text-sm font-medium">Modo de duplicación</p>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as DuplicationMode)}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center space-x-3 p-2 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value="structure" id="structure" />
                <Label htmlFor="structure" className="flex-1 cursor-pointer">
                  <span className="font-medium">Solo estructura</span>
                  <p className="text-xs text-muted-foreground">Layout y componentes, sin contenido</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-2 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value="content" id="content" />
                <Label htmlFor="content" className="flex-1 cursor-pointer">
                  <span className="font-medium">Incluir contenido</span>
                  <p className="text-xs text-muted-foreground">Estructura + textos e imágenes</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-2 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  <span className="font-medium">Réplica completa</span>
                  <p className="text-xs text-muted-foreground">Estructura, contenido, colores y tipografía</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={() => onDuplicate(mode)}>
              Duplicar página
            </Button>
          </div>
        </>
      ) : (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">Error al analizar la página</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      )}
    </motion.div>
  );
}
