import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FileVersion {
  id: string;
  file_id: string | null;
  project_id: string;
  file_path: string;
  content: string | null;
  version_number: number;
  change_type: string | null;
  change_description: string | null;
  created_at: string | null;
  created_by: string | null;
}

export type ChangeType = "manual" | "ai_generated" | "restored";

export function useFileVersions(projectId: string | undefined) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all versions for a specific file
  const getVersions = useCallback(
    async (fileId: string): Promise<FileVersion[]> => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("file_versions")
        .select("*")
        .eq("file_id", fileId)
        .eq("project_id", projectId)
        .order("version_number", { ascending: false });

      if (error) {
        console.error("Error fetching versions:", error);
        return [];
      }

      return data || [];
    },
    [projectId]
  );

  // Fetch all versions for the entire project
  const getProjectHistory = useCallback(async (): Promise<FileVersion[]> => {
    if (!projectId) return [];

    setLoading(true);
    const { data, error } = await supabase
      .from("file_versions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(100);

    setLoading(false);

    if (error) {
      console.error("Error fetching project history:", error);
      return [];
    }

    setVersions(data || []);
    return data || [];
  }, [projectId]);

  // Create a new version
  const createVersion = useCallback(
    async (
      fileId: string | null,
      filePath: string,
      content: string,
      changeType: ChangeType,
      description?: string
    ): Promise<FileVersion | null> => {
      if (!projectId || !user) return null;

      // Get the latest version number for this file
      let versionNumber = 1;
      if (fileId) {
        const { data: existingVersions } = await supabase
          .from("file_versions")
          .select("version_number")
          .eq("file_id", fileId)
          .order("version_number", { ascending: false })
          .limit(1);

        if (existingVersions && existingVersions.length > 0) {
          versionNumber = existingVersions[0].version_number + 1;
        }
      }

      const { data, error } = await supabase
        .from("file_versions")
        .insert({
          file_id: fileId,
          project_id: projectId,
          file_path: filePath,
          content,
          version_number: versionNumber,
          change_type: changeType,
          change_description: description,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating version:", error);
        return null;
      }

      return data;
    },
    [projectId, user]
  );

  // Restore a previous version
  const restoreVersion = useCallback(
    async (
      versionId: string,
      onRestore: (filePath: string, content: string) => Promise<void>
    ): Promise<boolean> => {
      if (!projectId) return false;

      // Get the version to restore
      const { data: version, error: fetchError } = await supabase
        .from("file_versions")
        .select("*")
        .eq("id", versionId)
        .single();

      if (fetchError || !version) {
        console.error("Error fetching version:", fetchError);
        return false;
      }

      // Call the restore callback
      await onRestore(version.file_path, version.content || "");

      // Create a new version marking it as restored
      await createVersion(
        version.file_id,
        version.file_path,
        version.content || "",
        "restored",
        `Restaurado desde versión ${version.version_number}`
      );

      return true;
    },
    [projectId, createVersion]
  );

  // Get versions grouped by file
  const getVersionsByFile = useCallback(
    async (): Promise<Record<string, FileVersion[]>> => {
      if (!projectId) return {};

      const { data, error } = await supabase
        .from("file_versions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching versions:", error);
        return {};
      }

      // Group by file_path
      const grouped: Record<string, FileVersion[]> = {};
      (data || []).forEach((version) => {
        if (!grouped[version.file_path]) {
          grouped[version.file_path] = [];
        }
        grouped[version.file_path].push(version);
      });

      return grouped;
    },
    [projectId]
  );

  return {
    versions,
    loading,
    getVersions,
    getProjectHistory,
    createVersion,
    restoreVersion,
    getVersionsByFile,
  };
}
