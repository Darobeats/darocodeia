import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectContextItem {
  id: string;
  project_id: string;
  context_type: string;
  key: string;
  value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type ContextType = 
  | "tech_stack" 
  | "style_guide" 
  | "business_rules" 
  | "learned_preference";

export interface TechStackValue {
  name: string;
  version?: string;
}

export interface StyleGuideColors {
  primary?: string;
  secondary?: string;
  background?: string;
  textPrimary?: string;
  accent?: string;
}

export interface StyleGuideTypography {
  headings?: string;
  body?: string;
}

export function useProjectContext(projectId: string | undefined) {
  const [context, setContext] = useState<ProjectContextItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all context for a project
  const fetchContext = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("project_context")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      setContext((data as unknown as ProjectContextItem[]) || []);
    } catch (error) {
      console.error("Error fetching project context:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Save or update a context item
  const saveContext = useCallback(async (
    contextType: ContextType,
    key: string,
    value: Record<string, unknown>
  ) => {
    if (!projectId) return null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("project_context")
        .upsert(
          {
            project_id: projectId,
            context_type: contextType,
            key,
            value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "project_id,context_type,key" }
        )
        .select()
        .single();

      if (error) throw error;
      
      const newItem = data as unknown as ProjectContextItem;
      
      // Update local state
      setContext(prev => {
        const existing = prev.findIndex(
          c => c.context_type === contextType && c.key === key
        );
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newItem;
          return updated;
        }
        return [...prev, newItem];
      });

      return newItem;
    } catch (error) {
      console.error("Error saving context:", error);
      return null;
    }
  }, [projectId]);

  // Delete a context item
  const deleteContext = useCallback(async (contextType: ContextType, key: string) => {
    if (!projectId) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("project_context")
        .delete()
        .eq("project_id", projectId)
        .eq("context_type", contextType)
        .eq("key", key);

      if (error) throw error;

      setContext(prev => 
        prev.filter(c => !(c.context_type === contextType && c.key === key))
      );
    } catch (error) {
      console.error("Error deleting context:", error);
    }
  }, [projectId]);

  // Get context by type
  const getContextByType = useCallback((type: ContextType): ProjectContextItem[] => {
    return context.filter(c => c.context_type === type);
  }, [context]);

  // Get a specific context value
  const getContextValue = useCallback((type: ContextType, key: string): Record<string, unknown> | null => {
    const item = context.find(c => c.context_type === type && c.key === key);
    return item?.value || null;
  }, [context]);

  // Format all context for AI prompt injection
  const formatContextForPrompt = useCallback((): string => {
    if (context.length === 0) return "";

    const sections: string[] = [];

    // Tech Stack
    const techStack = getContextByType("tech_stack");
    if (techStack.length > 0) {
      const stackItems = techStack.map(item => {
        const val = item.value as unknown as TechStackValue;
        return `- ${item.key}: ${val?.name || "unknown"}${val?.version ? ` v${val.version}` : ""}`;
      });
      sections.push(`TECH STACK:\n${stackItems.join("\n")}`);
    }

    // Style Guide
    const styleGuide = getContextByType("style_guide");
    if (styleGuide.length > 0) {
      const styleItems = styleGuide.map(item => {
        if (item.key === "colors") {
          const colors = item.value as unknown as StyleGuideColors;
          return `- Colors: Primary=${colors?.primary || "default"}, Secondary=${colors?.secondary || "default"}, Background=${colors?.background || "default"}`;
        }
        if (item.key === "typography") {
          const fonts = item.value as unknown as StyleGuideTypography;
          return `- Typography: Headings=${fonts?.headings || "default"}, Body=${fonts?.body || "default"}`;
        }
        return `- ${item.key}: ${JSON.stringify(item.value)}`;
      });
      sections.push(`STYLE GUIDE:\n${styleItems.join("\n")}`);
    }

    // Learned Preferences
    const preferences = getContextByType("learned_preference");
    if (preferences.length > 0) {
      const prefItems = preferences.map(item => 
        `- ${item.key}: ${JSON.stringify(item.value)}`
      );
      sections.push(`USER PREFERENCES:\n${prefItems.join("\n")}`);
    }

    // Business Rules
    const rules = getContextByType("business_rules");
    if (rules.length > 0) {
      const ruleItems = rules.map(item => 
        `- ${item.key}: ${JSON.stringify(item.value)}`
      );
      sections.push(`BUSINESS RULES:\n${ruleItems.join("\n")}`);
    }

    return sections.join("\n\n");
  }, [context, getContextByType]);

  // Learn from website duplication (extract and save branding)
  const learnFromWebsite = useCallback(async (branding: {
    colors?: StyleGuideColors;
    fonts?: Array<{ family: string }>;
    colorScheme?: string;
  }) => {
    if (!branding) return;

    // Save colors if detected
    if (branding.colors) {
      await saveContext("style_guide", "colors", branding.colors as unknown as Record<string, unknown>);
    }

    // Save typography if detected
    if (branding.fonts && branding.fonts.length > 0) {
      await saveContext("style_guide", "typography", {
        headings: branding.fonts[0]?.family,
        body: branding.fonts[1]?.family || branding.fonts[0]?.family,
      });
    }

    // Save color scheme preference
    if (branding.colorScheme) {
      await saveContext("learned_preference", "color_scheme", {
        preference: branding.colorScheme,
      });
    }
  }, [saveContext]);

  // Learn from generated code (detect patterns)
  const learnFromGeneration = useCallback(async (files: Array<{ path: string; content: string }>) => {
    if (files.length === 0) return;

    // Detect framework/library usage
    const hasReact = files.some(f => f.content.includes("import React"));
    const hasTailwind = files.some(f => f.content.includes("className="));
    const hasFramerMotion = files.some(f => f.content.includes("framer-motion"));

    if (hasReact) {
      await saveContext("tech_stack", "framework", { name: "React", version: "18" });
    }
    if (hasTailwind) {
      await saveContext("tech_stack", "styling", { name: "Tailwind CSS" });
    }
    if (hasFramerMotion) {
      await saveContext("tech_stack", "animation", { name: "Framer Motion" });
    }

    // Detect naming conventions
    const usesArrowFunctions = files.some(f => 
      f.content.includes("const") && f.content.includes("=>")
    );
    const usesFunctionalComponents = files.some(f => 
      f.content.includes("export default function") || 
      f.content.includes("export function")
    );

    if (usesArrowFunctions || usesFunctionalComponents) {
      await saveContext("learned_preference", "component_style", {
        functional: true,
        arrowFunctions: usesArrowFunctions,
      });
    }
  }, [saveContext]);

  return {
    context,
    loading,
    fetchContext,
    saveContext,
    deleteContext,
    getContextByType,
    getContextValue,
    formatContextForPrompt,
    learnFromWebsite,
    learnFromGeneration,
  };
}
