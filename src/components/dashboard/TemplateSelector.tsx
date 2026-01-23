import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, FileCode, Layout, Briefcase, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string;
  is_premium: boolean;
  files: Array<{ file_path: string; content: string; language: string }>;
}

interface TemplateSelectorProps {
  selectedTemplate: ProjectTemplate | null;
  onSelectTemplate: (template: ProjectTemplate | null) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  blank: <FileCode className="w-8 h-8" />,
  landing: <Layout className="w-8 h-8" />,
  dashboard: <Briefcase className="w-8 h-8" />,
  portfolio: <Briefcase className="w-8 h-8" />,
  ecommerce: <ShoppingCart className="w-8 h-8" />,
};

const categoryLabels: Record<string, string> = {
  blank: "Vacío",
  landing: "Landing",
  dashboard: "Dashboard",
  portfolio: "Portfolio",
  ecommerce: "E-commerce",
};

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("project_templates")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;

      // Parse files JSON and cast to proper type
      const parsedTemplates = (data || []).map((t) => ({
        ...t,
        files: (Array.isArray(t.files) ? t.files : []) as Array<{ file_path: string; content: string; language: string }>,
      }));

      setTemplates(parsedTemplates as ProjectTemplate[]);
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Selecciona una plantilla (opcional)
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {templates.map((template) => {
          const isSelected = selectedTemplate?.id === template.id;
          const isBlank = template.category === "blank";

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(isSelected ? null : template)}
              className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center hover:border-primary/50",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card/50 hover:bg-card"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}

              {template.thumbnail_url && !isBlank ? (
                <div className="w-full h-16 mb-2 rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={template.thumbnail_url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-16 mb-2 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground">
                  {categoryIcons[template.category] || <FileCode className="w-8 h-8" />}
                </div>
              )}

              <span className="text-sm font-medium truncate w-full">
                {template.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {categoryLabels[template.category] || template.category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
