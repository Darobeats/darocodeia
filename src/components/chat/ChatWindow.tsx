import { memo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Trash2, FileCode2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SuggestionChips } from "./SuggestionChips";
import { useLanguage } from "@/i18n/LanguageContext";
import { whatsappLink } from "@/data/contact";
import type {
  ChatMessage as ChatMessageType,
  ChangeProposal,
} from "@/hooks/useChatAssistant";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.28-.47-2.44-1.5-.9-.8-1.5-1.79-1.68-2.09-.17-.3-.02-.46.13-.61.15-.15.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.19-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.32 5.07 4.53 2.98 1.21 2.98.81 3.52.76.54-.05 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.12-.27-.2-.57-.35Z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.1.81.83-3.03-.2-.31a8.16 8.16 0 0 1-1.25-4.36c0-4.53 3.69-8.22 8.23-8.22 2.2 0 4.26.86 5.81 2.41a8.16 8.16 0 0 1 2.41 5.82c0 4.54-3.69 8.2-8.25 8.2Z" />
    </svg>
  );
}

interface ChatWindowProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onSend: (message: string) => void;
  onClose: () => void;
  onClear: () => void;
  proposal?: ChangeProposal | null;
  isApplying?: boolean;
  onApplyProposal?: () => void;
  onDiscardProposal?: () => void;
}

export const ChatWindow = memo(function ChatWindow({
  messages,
  isLoading,
  onSend,
  onClose,
  onClear,
  proposal,
  isApplying,
  onApplyProposal,
  onDiscardProposal,
}: ChatWindowProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const showSuggestions = messages.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] max-w-md h-[500px] max-h-[70vh] bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">D</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t("chat.title")}</h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? t("chat.thinking") : "Online"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex flex-col">
          {/* Welcome message */}
          {showSuggestions && (
            <div className="p-4">
              <ChatMessage role="assistant" content={t("chat.greeting")} />
            </div>
          )}

          {/* Chat messages */}
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}

          {/* Loading indicator */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs">{t("chat.thinking")}</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Pending code proposal */}
      {proposal && (
        <div className="border-t border-border/30 bg-secondary/30 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <FileCode2 className="h-4 w-4 text-primary" />
            <span>Cambios propuestos ({proposal.files.length})</span>
          </div>
          {proposal.summary && (
            <p className="text-xs text-muted-foreground">{proposal.summary}</p>
          )}
          <ul className="max-h-24 overflow-y-auto space-y-1">
            {proposal.files.map((f) => (
              <li key={f.path} className="text-xs font-mono text-muted-foreground truncate">
                {f.path}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={onApplyProposal}
              disabled={isApplying}
            >
              {isApplying ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1" />
              )}
              Aplicar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={onDiscardProposal}
              disabled={isApplying}
            >
              Descartar
            </Button>
          </div>
        </div>
      )}

      {/* Suggestion chips */}
      {showSuggestions && <SuggestionChips onSelect={onSend} disabled={isLoading} />}

      {/* Input */}
      <ChatInput onSend={onSend} disabled={isLoading} />
    </motion.div>
  );
});
