import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Snippet {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  tags: string[];
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSnippetData {
  title: string;
  description?: string;
  code: string;
  language?: string;
  tags?: string[];
  is_public?: boolean;
}

export interface UpdateSnippetData {
  title?: string;
  description?: string;
  code?: string;
  language?: string;
  tags?: string[];
  is_public?: boolean;
}

export function useSnippets() {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSnippets = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("code_snippets")
        .select("*")
        .order("usage_count", { ascending: false });

      if (fetchError) throw fetchError;
      setSnippets(data || []);
    } catch (err) {
      console.error("Error fetching snippets:", err);
      setError("Error al cargar snippets");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  const createSnippet = async (data: CreateSnippetData): Promise<Snippet | null> => {
    if (!user) return null;

    try {
      const { data: newSnippet, error } = await supabase
        .from("code_snippets")
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description || null,
          code: data.code,
          language: data.language || "typescript",
          tags: data.tags || [],
          is_public: data.is_public || false,
        })
        .select()
        .single();

      if (error) throw error;

      setSnippets((prev) => [newSnippet, ...prev]);
      return newSnippet;
    } catch (err) {
      console.error("Error creating snippet:", err);
      throw err;
    }
  };

  const updateSnippet = async (
    id: string,
    data: UpdateSnippetData
  ): Promise<Snippet | null> => {
    try {
      const { data: updated, error } = await supabase
        .from("code_snippets")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setSnippets((prev) =>
        prev.map((s) => (s.id === id ? updated : s))
      );
      return updated;
    } catch (err) {
      console.error("Error updating snippet:", err);
      throw err;
    }
  };

  const deleteSnippet = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("code_snippets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSnippets((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Error deleting snippet:", err);
      throw err;
    }
  };

  const incrementUsage = async (id: string): Promise<void> => {
    try {
      const snippet = snippets.find((s) => s.id === id);
      if (!snippet) return;

      await supabase
        .from("code_snippets")
        .update({ usage_count: snippet.usage_count + 1 })
        .eq("id", id);

      setSnippets((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, usage_count: s.usage_count + 1 } : s
        )
      );
    } catch (err) {
      console.error("Error incrementing usage:", err);
    }
  };

  const searchSnippets = useCallback(
    (query: string): Snippet[] => {
      if (!query.trim()) return snippets;

      const lowerQuery = query.toLowerCase();
      return snippets.filter(
        (s) =>
          s.title.toLowerCase().includes(lowerQuery) ||
          s.description?.toLowerCase().includes(lowerQuery) ||
          s.tags.some((t) => t.toLowerCase().includes(lowerQuery)) ||
          s.code.toLowerCase().includes(lowerQuery)
      );
    },
    [snippets]
  );

  const filterByTag = useCallback(
    (tag: string): Snippet[] => {
      return snippets.filter((s) =>
        s.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      );
    },
    [snippets]
  );

  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>();
    snippets.forEach((s) => s.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [snippets]);

  return {
    snippets,
    loading,
    error,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    incrementUsage,
    searchSnippets,
    filterByTag,
    getAllTags,
    refetch: fetchSnippets,
  };
}
