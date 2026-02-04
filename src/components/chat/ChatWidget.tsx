import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "./ChatWindow";
import { useChatAssistant } from "@/hooks/useChatAssistant";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, sendMessage, clearMessages } = useChatAssistant();

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSend={sendMessage}
            onClose={handleClose}
            onClear={clearMessages}
          />
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        className="fixed bottom-4 right-4 sm:right-6 z-50"
      >
        <Button
          onClick={toggleChat}
          size="lg"
          className={`
            h-14 w-14 rounded-full shadow-lg
            bg-gradient-to-br from-primary to-accent
            hover:shadow-[0_0_30px_hsl(175_80%_50%_/_0.4)]
            transition-all duration-300
            ${isOpen ? "rotate-0" : ""}
          `}
        >
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        </Button>
        
        {/* Pulse animation when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/30 pointer-events-none" />
        )}
      </motion.div>
    </>
  );
}
