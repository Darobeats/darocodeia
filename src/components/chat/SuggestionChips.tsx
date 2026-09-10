import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { whatsappLink } from "@/data/contact";

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.28-.47-2.44-1.5-.9-.8-1.5-1.79-1.68-2.09-.17-.3-.02-.46.13-.61.15-.15.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.19-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.32 5.07 4.53 2.98 1.21 2.98.81 3.52.76.54-.05 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.12-.27-.2-.57-.35Z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.1.81.83-3.03-.2-.31a8.16 8.16 0 0 1-1.25-4.36c0-4.53 3.69-8.22 8.23-8.22 2.2 0 4.26.86 5.81 2.41a8.16 8.16 0 0 1 2.41 5.82c0 4.54-3.69 8.2-8.25 8.2Z" />
    </svg>
  );
}

export const SuggestionChips = memo(function SuggestionChips({
  onSelect,
  disabled,
}: SuggestionChipsProps) {
  const { t } = useLanguage();

  const suggestions = [
    t("chat.suggestions.whatIs"),
    t("chat.suggestions.features"),
    t("chat.suggestions.howToStart"),
    t("chat.suggestions.projects"),
  ];

  return (
    <div className="flex flex-wrap gap-2 p-4 border-t border-border/30">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className="text-xs bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-primary/30"
        >
          {suggestion}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={disabled}
        className="text-xs gap-1.5 bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 hover:border-[#25D366]/50 hover:text-[#25D366]"
      >
        <a
          href={whatsappLink(t("chat.suggestions.whatsappMessage"))}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon className="h-3.5 w-3.5 fill-current" />
          {t("chat.suggestions.whatsapp")}
        </a>
      </Button>
    </div>
  );
});
