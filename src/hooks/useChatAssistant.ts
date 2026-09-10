import { useState, useCallback, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ProposedFile {
  path: string;
  content: string;
  language?: string;
}

export interface ChangeProposal {
  summary: string;
  files: ProposedFile[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;
const APPLY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apply-proposal`;

const PROJECT_PATH_RE =
  /\/dashboard\/projects\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

const AUTH_REQUIRED_MESSAGE = {
  es: "Para conversar conmigo necesitas una cuenta. Inicia sesión en /login o solicita acceso en /solicitar-acceso y vuelve a preguntarme. 🙂",
  en: "You need an account to chat with me. Sign in at /login or request access at /solicitar-acceso and ask me again. 🙂",
};

const LIMIT_MESSAGE = {
  es: "Estoy recibiendo demasiadas preguntas en este momento. Espera unos segundos e inténtalo de nuevo.",
  en: "I'm getting too many questions right now. Wait a few seconds and try again.",
};

/** Extract assistant text deltas from a batch of SSE lines. Returns [text, done]. */
function parseSseLines(lines: string[]): [string, boolean] {
  let text = "";
  let done = false;
  for (let line of lines) {
    if (line.endsWith("\r")) line = line.slice(0, -1);
    if (!line || line.startsWith(":") || line.trim() === "") continue;
    if (!line.startsWith("data: ")) continue;
    const jsonStr = line.slice(6).trim();
    if (jsonStr === "[DONE]") {
      done = true;
      break;
    }
    try {
      const parsed = JSON.parse(jsonStr);
      const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
      if (delta) text += delta;
    } catch {
      /* incomplete chunk: ignore, it will arrive complete on the next read */
    }
  }
  return [text, done];
}

export function useChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ChangeProposal | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const { locale, t } = useLanguage();
  const location = useLocation();
  const projectId = useMemo(
    () => location.pathname.match(PROJECT_PATH_RE)?.[1] ?? null,
    [location.pathname]
  );


  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const pushAssistant = (text: string) =>
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: text, timestamp: new Date() },
        ]);

      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      const upsertAssistant = (nextChunk: string) => {
        if (!nextChunk) return;
        assistantContent += nextChunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === assistantId) {
            return prev.map((m) =>
              m.id === assistantId ? { ...m, content: assistantContent } : m
            );
          }
          return [
            ...prev,
            {
              id: assistantId,
              role: "assistant",
              content: assistantContent,
              timestamp: new Date(),
            },
          ];
        });
      };

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setError(AUTH_REQUIRED_MESSAGE[locale === "en" ? "en" : "es"]);
          pushAssistant(AUTH_REQUIRED_MESSAGE[locale === "en" ? "en" : "es"]);
          return;
        }

        const apiMessages = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: apiMessages,
            locale,
            currentPage: location.pathname,
          }),
        });

        if (resp.status === 401) {
          const msg = AUTH_REQUIRED_MESSAGE[locale === "en" ? "en" : "es"];
          setError(msg);
          pushAssistant(msg);
          return;
        }

        if (resp.status === 429) {
          const msg = LIMIT_MESSAGE[locale === "en" ? "en" : "es"];
          setError(msg);
          pushAssistant(msg);
          return;
        }

        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error ${resp.status}`);
        }

        if (!resp.body) throw new Error("No response body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          const lastNewline = textBuffer.lastIndexOf("\n");
          if (lastNewline === -1) continue;
          const complete = textBuffer.slice(0, lastNewline).split("\n");
          textBuffer = textBuffer.slice(lastNewline + 1);

          const [text, finished] = parseSseLines(complete);
          upsertAssistant(text);
          if (finished) streamDone = true;
        }

        // Final flush of whatever is left in the buffer
        if (textBuffer.trim()) {
          const [text] = parseSseLines(textBuffer.split("\n"));
          upsertAssistant(text);
        }
      } catch (err) {
        console.error("Chat error:", err);
        setError(err instanceof Error ? err.message : t("chat.error"));
        pushAssistant(t("chat.error"));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, locale, location.pathname, t]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
