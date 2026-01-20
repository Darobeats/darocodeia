import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Palette,
  Code2,
  Settings2,
  Lightbulb,
  Trash2,
  Brain,
} from "lucide-react";
import {
  useProjectContext,
  ContextType,
  ProjectContextItem,
} from "@/hooks/useProjectContext";

interface ProjectContextPanelProps {
  projectId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const CONTEXT_TYPE_CONFIG: Record<ContextType, { 
  label: string; 
  icon: typeof Palette; 
  color: string;
}> = {
  tech_stack: { label: "Stack Tecnológico", icon: Code2, color: "text-blue-500" },
  style_guide: { label: "Guía de Estilo", icon: Palette, color: "text-purple-500" },
  business_rules: { label: "Reglas de Negocio", icon: Settings2, color: "text-orange-500" },
  learned_preference: { label: "Preferencias Aprendidas", icon: Lightbulb, color: "text-green-500" },
};

function ContextItemCard({ 
  item, 
  onDelete 
}: { 
  item: ProjectContextItem; 
  onDelete: () => void;
}) {
  const config = CONTEXT_TYPE_CONFIG[item.context_type as ContextType];
  const Icon = config?.icon || Settings2;

  const formatValue = (value: unknown): string => {
    if (typeof value === "object" && value !== null) {
      return Object.entries(value as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    }
    return String(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors"
    >
      <div className={`mt-0.5 ${config?.color || "text-muted-foreground"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm capitalize">{item.key.replace(/_/g, " ")}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {config?.label || item.context_type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {formatValue(item.value)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <Trash2 className="w-3.5 h-3.5 text-destructive" />
      </Button>
    </motion.div>
  );
}

export default function ProjectContextPanel({
  projectId,
  isOpen,
  onClose,
}: ProjectContextPanelProps) {
  const {
    context,
    loading,
    fetchContext,
    deleteContext,
    getContextByType,
  } = useProjectContext(projectId);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchContext();
    }
  }, [isOpen, projectId, fetchContext]);

  const contextTypes: ContextType[] = [
    "tech_stack",
    "style_guide",
    "learned_preference",
    "business_rules",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-80 bg-background border-l border-border shadow-xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Memoria del Proyecto</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm">Cargando contexto...</p>
                </div>
              ) : context.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Sin memoria aún
                  </p>
                  <p className="text-xs text-muted-foreground">
                    La IA aprenderá automáticamente de tus prompts y las páginas que dupliques.
                  </p>
                </div>
              ) : (
                contextTypes.map((type) => {
                  const items = getContextByType(type);
                  if (items.length === 0) return null;

                  const config = CONTEXT_TYPE_CONFIG[type];
                  const Icon = config.icon;

                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <h4 className="text-sm font-medium">{config.label}</h4>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {items.length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                          {items.map((item) => (
                            <ContextItemCard
                              key={item.id}
                              item={item}
                              onDelete={() => deleteContext(type, item.key)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              La IA usa esta información para generar código consistente con tu proyecto.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
