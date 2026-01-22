import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GitHubConnection {
  id: string;
  user_id: string;
  github_username: string;
  created_at: string;
}

interface PushToGitHubOptions {
  repoName: string;
  isPrivate: boolean;
  description?: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

export function useGitHub() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<GitHubConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPushing, setIsPushing] = useState(false);

  const fetchConnection = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("github_connections")
        .select("id, user_id, github_username, created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching GitHub connection:", error);
      }

      setConnection(data);
    } catch (err) {
      console.error("Error fetching GitHub connection:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  const initiateOAuth = async () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    
    if (!clientId) {
      throw new Error("GitHub OAuth no está configurado. Contacta al administrador.");
    }

    const redirectUri = `${window.location.origin}/api/github/callback`;
    const scope = "repo user:email";
    const state = crypto.randomUUID();

    // Store state for verification
    sessionStorage.setItem("github_oauth_state", state);

    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("state", state);

    window.location.href = authUrl.toString();
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    const storedState = sessionStorage.getItem("github_oauth_state");
    
    if (state !== storedState) {
      throw new Error("Invalid OAuth state");
    }

    sessionStorage.removeItem("github_oauth_state");

    // Call edge function to exchange code for token
    const { data, error } = await supabase.functions.invoke("github-auth", {
      body: { code },
    });

    if (error) throw error;

    await fetchConnection();
    return data;
  };

  const disconnect = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("github_connections")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setConnection(null);
    } catch (err) {
      console.error("Error disconnecting GitHub:", err);
      throw err;
    }
  };

  const pushToGitHub = async (options: PushToGitHubOptions) => {
    if (!connection) {
      throw new Error("No hay conexión con GitHub");
    }

    setIsPushing(true);

    try {
      const { data, error } = await supabase.functions.invoke("github-push", {
        body: {
          repoName: options.repoName,
          isPrivate: options.isPrivate,
          description: options.description,
          files: options.files,
        },
      });

      if (error) throw error;

      return data;
    } finally {
      setIsPushing(false);
    }
  };

  return {
    connection,
    isConnected: !!connection,
    loading,
    isPushing,
    initiateOAuth,
    handleOAuthCallback,
    disconnect,
    pushToGitHub,
    refetch: fetchConnection,
  };
}
