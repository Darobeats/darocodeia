import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PublicProject {
  id: string;
  name: string;
  description: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  technologies: string[] | null;
  updated_at: string | null;
}

export function usePublicProjects() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("projects")
          .select("id, name, description, preview_url, thumbnail_url, technologies, updated_at")
          .eq("is_public", true)
          .order("updated_at", { ascending: false })
          .limit(12);

        if (fetchError) throw fetchError;
        setProjects(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching public projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProjects();
  }, []);

  return { projects, loading, error };
}
