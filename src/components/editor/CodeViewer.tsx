import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
}

// Map common language identifiers to Prism language names
const languageMap: Record<string, string> = {
  typescript: 'tsx',
  javascript: 'jsx',
  ts: 'tsx',
  tsx: 'tsx',
  js: 'jsx',
  jsx: 'jsx',
  css: 'css',
  html: 'html',
  json: 'json',
  markdown: 'markdown',
  md: 'markdown',
  python: 'python',
  sql: 'sql',
  bash: 'bash',
  shell: 'bash',
  plaintext: 'text',
};

export default function CodeViewer({ 
  code, 
  language, 
  showLineNumbers = true 
}: CodeViewerProps) {
  const prismLanguage = languageMap[language?.toLowerCase()] || 'javascript';

  return (
    <SyntaxHighlighter
      language={prismLanguage}
      style={oneDark}
      showLineNumbers={showLineNumbers}
      wrapLines
      lineNumberStyle={{
        minWidth: '3em',
        paddingRight: '1em',
        color: 'hsl(var(--muted-foreground))',
        opacity: 0.5,
        userSelect: 'none',
      }}
      customStyle={{
        margin: 0,
        padding: '1rem',
        background: 'transparent',
        fontSize: '0.875rem',
        lineHeight: '1.5',
      }}
      codeTagProps={{
        style: {
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        },
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
