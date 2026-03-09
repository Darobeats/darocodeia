import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import CodeBlock from "./CodeBlock";
import { DocItem } from "@/data/documentation";

interface DocsContentProps {
  item: DocItem;
}

const DocsContent = ({ item }: DocsContentProps) => {
  // Parse markdown content into sections
  const parseContent = (content: string) => {
    const lines = content.trim().split("\n");
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(" ").trim();
        if (text) {
          elements.push(
            <p key={elements.length} className="text-muted-foreground leading-relaxed mb-4">
              {parseInlineMarkdown(text)}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={elements.length} className="list-disc list-inside space-y-2 mb-4 text-muted-foreground">
            {listItems.map((item, i) => (
              <li key={i}>{parseInlineMarkdown(item)}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    const parseInlineMarkdown = (text: string) => {
      // Bold
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
      // Inline code
      text = text.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-primary text-sm font-mono">$1</code>');
      // Links
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>');

      return <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text, { ALLOWED_URI_REGEXP: /^https?:\/\//i }) }} />;
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) {
        flushParagraph();
        flushList();
        return;
      }

      // Headers
      if (trimmedLine.startsWith("# ")) {
        flushParagraph();
        flushList();
        elements.push(
          <h1 key={elements.length} className="text-3xl font-bold mb-6 gradient-text">
            {trimmedLine.slice(2)}
          </h1>
        );
        return;
      }

      if (trimmedLine.startsWith("## ")) {
        flushParagraph();
        flushList();
        elements.push(
          <h2 key={elements.length} className="text-xl font-semibold mb-4 mt-8 text-foreground">
            {trimmedLine.slice(3)}
          </h2>
        );
        return;
      }

      if (trimmedLine.startsWith("### ")) {
        flushParagraph();
        flushList();
        elements.push(
          <h3 key={elements.length} className="text-lg font-semibold mb-3 mt-6 text-foreground">
            {trimmedLine.slice(4)}
          </h3>
        );
        return;
      }

      // List items
      if (trimmedLine.startsWith("- ") || trimmedLine.match(/^\d+\.\s/)) {
        flushParagraph();
        inList = true;
        const itemText = trimmedLine.replace(/^-\s+/, "").replace(/^\d+\.\s+/, "");
        listItems.push(itemText);
        return;
      }

      // Regular paragraph
      if (inList) {
        flushList();
      }
      currentParagraph.push(trimmedLine);
    });

    flushParagraph();
    flushList();

    return elements;
  };

  return (
    <motion.article
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl"
    >
      <div className="prose prose-invert max-w-none">
        {parseContent(item.content)}
      </div>

      {item.code && item.code.length > 0 && (
        <div className="mt-8 space-y-4">
          {item.code.map((codeBlock, index) => (
            <CodeBlock
              key={index}
              code={codeBlock.code.trim()}
              language={codeBlock.language}
            />
          ))}
        </div>
      )}
    </motion.article>
  );
};

export default DocsContent;
