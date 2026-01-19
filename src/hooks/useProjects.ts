import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  commits_count: number | null;
  deploys_count: number | null;
  errors_count: number | null;
  uptime_percentage: number | null;
  last_deploy_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  status?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: string;
}

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (fetchError) throw fetchError;
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error("Error al cargar proyectos");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createProject = async (data: CreateProjectData): Promise<Project | null> => {
    if (!user) {
      toast.error("Debes iniciar sesión para crear un proyecto");
      return null;
    }

    try {
      const { data: newProject, error } = await supabase
        .from("projects")
        .insert({
          name: data.name,
          description: data.description || null,
          status: data.status || "active",
          user_id: user.id,
          commits_count: 0,
          deploys_count: 0,
          errors_count: 0,
          uptime_percentage: 100,
        })
        .select()
        .single();

      if (error) throw error;

      setProjects((prev) => [newProject, ...prev]);
      toast.success("Proyecto creado exitosamente");
      return newProject;
    } catch (err: any) {
      toast.error(err.message || "Error al crear el proyecto");
      return null;
    }
  };

  const updateProject = async (id: string, data: UpdateProjectData): Promise<Project | null> => {
    if (!user) {
      toast.error("Debes iniciar sesión para actualizar el proyecto");
      return null;
    }

    try {
      const { data: updatedProject, error } = await supabase
        .from("projects")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) => (p.id === id ? updatedProject : p))
      );
      toast.success("Proyecto actualizado exitosamente");
      return updatedProject;
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar el proyecto");
      return null;
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error("Debes iniciar sesión para eliminar el proyecto");
      return false;
    }

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Proyecto eliminado exitosamente");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar el proyecto");
      return false;
    }
  };

  const duplicateProject = async (project: Project): Promise<Project | null> => {
    return createProject({
      name: `${project.name} (copia)`,
      description: project.description || undefined,
      status: "active",
    });
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
  };
}
