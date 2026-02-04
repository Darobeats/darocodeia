import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
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
    </div>
  );
});
