import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export const ChatMessage = memo(function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "bg-muted/30" : "bg-transparent"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-primary/10 text-primary"
              : "bg-gradient-to-br from-primary to-accent text-primary-foreground"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <div
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none",
            "prose-p:my-1 prose-ul:my-1 prose-ol:my-1",
            "prose-headings:text-foreground prose-p:text-foreground/90",
            "prose-strong:text-foreground prose-code:text-primary",
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          )}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
});
