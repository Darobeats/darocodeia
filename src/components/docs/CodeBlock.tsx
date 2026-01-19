import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language: string;
}

const languageLabels: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  bash: "Bash",
  json: "JSON",
  yaml: "YAML",
  sql: "SQL",
};

const CodeBlock = ({ code, language }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting with CSS classes
  const highlightCode = (code: string, lang: string) => {
    let highlighted = code;

    // Escape HTML
    highlighted = highlighted
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (lang === "typescript" || lang === "javascript") {
      // Keywords
      highlighted = highlighted.replace(
        /\b(import|export|from|const|let|var|function|return|if|else|async|await|new|class|extends|interface|type|default|as)\b/g,
        '<span class="text-accent">$1</span>'
      );
      // Strings
      highlighted = highlighted.replace(
        /(['"`])(.*?)\1/g,
        '<span class="text-green-400">$1$2$1</span>'
      );
      // Comments
      highlighted = highlighted.replace(
        /(\/\/.*$)/gm,
        '<span class="text-muted-foreground">$1</span>'
      );
      // Numbers
      highlighted = highlighted.replace(
        /\b(\d+)\b/g,
        '<span class="text-orange-400">$1</span>'
      );
    } else if (lang === "bash") {
      // Commands
      highlighted = highlighted.replace(
        /^(\s*)(npm|yarn|darocode|git|cd|mkdir)/gm,
        '$1<span class="text-primary">$2</span>'
      );
      // Comments
      highlighted = highlighted.replace(
        /(#.*$)/gm,
        '<span class="text-muted-foreground">$1</span>'
      );
      // Flags
      highlighted = highlighted.replace(
        /(\s)(--?\w+)/g,
        '$1<span class="text-accent">$2</span>'
      );
    } else if (lang === "json") {
      // Keys
      highlighted = highlighted.replace(
        /"(\w+)":/g,
        '<span class="text-primary">"$1"</span>:'
      );
      // Strings
      highlighted = highlighted.replace(
        /:\s*"([^"]+)"/g,
        ': <span class="text-green-400">"$1"</span>'
      );
      // Numbers and booleans
      highlighted = highlighted.replace(
        /:\s*(true|false|\d+)/g,
        ': <span class="text-orange-400">$1</span>'
      );
    } else if (lang === "yaml") {
      // Keys
      highlighted = highlighted.replace(
        /^(\s*)(\w+):/gm,
        '$1<span class="text-primary">$2</span>:'
      );
      // Strings
      highlighted = highlighted.replace(
        /:\s*([^\n]+)/g,
        ': <span class="text-green-400">$1</span>'
      );
    } else if (lang === "sql") {
      // Keywords
      highlighted = highlighted.replace(
        /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|INDEX|PRIMARY|KEY|REFERENCES|ON|CASCADE|NOT|NULL|DEFAULT|AND|OR|JOIN|LEFT|RIGHT|INNER|OUTER)\b/gi,
        '<span class="text-accent">$1</span>'
      );
    }

    return highlighted;
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border bg-muted/50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <span className="text-xs text-muted-foreground font-mono">
          {languageLabels[language] || language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1" />
              <span className="text-xs">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1" />
              <span className="text-xs">Copiar</span>
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code
          className="text-sm font-mono leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: highlightCode(code, language),
          }}
        />
      </pre>
    </div>
  );
};

export default CodeBlock;
