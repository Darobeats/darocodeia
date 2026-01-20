import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  AlertTriangle, 
  Zap, 
  Check, 
  X,
  ArrowRight,
} from "lucide-react";

export interface AISuggestion {
  id: string;
  type: "improvement" | "warning" | "optimization";
  title: string;
  description: string;
  actionPrompt?: string;
}

interface AISuggestionCardProps {
  suggestion: AISuggestion;
  onApply?: (prompt: string) => void;
  onDismiss?: (id: string) => void;
}

const TYPE_CONFIG = {
  improvement: {
    icon: Lightbulb,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    label: "Mejora",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    label: "Advertencia",
  },
  optimization: {
    icon: Zap,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    label: "Optimización",
  },
};

export default function AISuggestionCard({
  suggestion,
  onApply,
  onDismiss,
}: AISuggestionCardProps) {
  const config = TYPE_CONFIG[suggestion.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{suggestion.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {suggestion.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3">
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onDismiss(suggestion.id)}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Ignorar
          </Button>
        )}
        {onApply && suggestion.actionPrompt && (
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={() => onApply(suggestion.actionPrompt!)}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Aplicar
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Helper function to generate suggestions from code analysis
export function analyzeCodeForSuggestions(
  files: Array<{ path: string; content: string }>
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  files.forEach((file) => {
    const content = file.content;

    // Check for missing error handling
    if (content.includes("fetch(") && !content.includes("catch")) {
      suggestions.push({
        id: `error-handling-${file.path}`,
        type: "improvement",
        title: "Agregar manejo de errores",
        description: `El archivo ${file.path.split("/").pop()} tiene llamadas fetch sin manejo de errores.`,
        actionPrompt: `Agrega try/catch y manejo de errores a las llamadas fetch en ${file.path}`,
      });
    }

    // Check for missing TypeScript types
    if (file.path.endsWith(".tsx") && content.includes(": any")) {
      suggestions.push({
        id: `types-${file.path}`,
        type: "warning",
        title: "Tipos TypeScript faltantes",
        description: "Se detectaron tipos 'any' que podrían mejorar con tipos específicos.",
        actionPrompt: `Mejora los tipos TypeScript en ${file.path}, reemplazando 'any' con tipos específicos`,
      });
    }

    // Check for accessibility issues
    if (content.includes("<img") && !content.includes("alt=")) {
      suggestions.push({
        id: `a11y-${file.path}`,
        type: "warning",
        title: "Accesibilidad: alt faltante",
        description: "Las imágenes deberían tener texto alternativo para accesibilidad.",
        actionPrompt: `Agrega atributos alt descriptivos a las imágenes en ${file.path}`,
      });
    }

    // Check for performance optimizations
    if (content.includes("useEffect") && content.includes("[]") && content.includes("fetch")) {
      suggestions.push({
        id: `perf-${file.path}`,
        type: "optimization",
        title: "Considerar React Query",
        description: "Las llamadas fetch en useEffect podrían beneficiarse de React Query para mejor caché.",
        actionPrompt: `Refactoriza ${file.path} para usar React Query en lugar de fetch en useEffect`,
      });
    }

    // Check for responsive design
    if (content.includes("className=") && !content.includes("md:") && !content.includes("lg:")) {
      suggestions.push({
        id: `responsive-${file.path}`,
        type: "improvement",
        title: "Mejorar diseño responsive",
        description: "El componente podría beneficiarse de más breakpoints responsive.",
        actionPrompt: `Agrega clases responsive (sm:, md:, lg:) a ${file.path} para mejor adaptación móvil`,
      });
    }
  });

  // Return unique suggestions (max 3)
  const uniqueSuggestions = suggestions.reduce((acc, curr) => {
    if (!acc.find(s => s.type === curr.type)) {
      acc.push(curr);
    }
    return acc;
  }, [] as AISuggestion[]);

  return uniqueSuggestions.slice(0, 3);
}
