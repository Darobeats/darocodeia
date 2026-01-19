import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Github, Chrome } from "lucide-react";

const SocialLoginButtons = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + "/dashboard",
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || `Error al iniciar sesión con ${provider}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        onClick={() => handleOAuthLogin("google")}
        disabled={loading !== null}
        className="w-full bg-secondary/50 border-border hover:bg-secondary"
      >
        {loading === "google" ? (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Chrome className="w-5 h-5 mr-2" />
            Google
          </>
        )}
      </Button>
      <Button
        variant="outline"
        onClick={() => handleOAuthLogin("github")}
        disabled={loading !== null}
        className="w-full bg-secondary/50 border-border hover:bg-secondary"
      >
        {loading === "github" ? (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Github className="w-5 h-5 mr-2" />
            GitHub
          </>
        )}
      </Button>
    </div>
  );
};

export default SocialLoginButtons;
