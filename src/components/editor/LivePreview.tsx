import { useMemo, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RotateCcw, 
  ExternalLink,
  Terminal,
  X,
} from "lucide-react";

interface ProjectFile {
  id: string;
  file_path: string;
  content: string | null;
  language: string | null;
}

interface LivePreviewProps {
  files: ProjectFile[];
  onError?: (error: string) => void;
}

type ViewportSize = "desktop" | "tablet" | "mobile";

const VIEWPORT_SIZES: Record<ViewportSize, { width: string; label: string }> = {
  desktop: { width: "100%", label: "Desktop" },
  tablet: { width: "768px", label: "Tablet" },
  mobile: { width: "375px", label: "Mobile" },
};

// Transform project files to Sandpack format
function transformFilesToSandpack(files: ProjectFile[]): Record<string, string> {
  const sandpackFiles: Record<string, string> = {};

  // Base entry point
  sandpackFiles["/index.tsx"] = `
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

  // Base HTML
  sandpackFiles["/public/index.html"] = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
`;

  // Default styles with Tailwind imports
  sandpackFiles["/styles.css"] = `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}
`;

  // Default App component if none exists
  let hasAppComponent = false;

  files.forEach((file) => {
    const path = file.file_path;
    const content = file.content || "";
    
    // Normalize path for Sandpack (must start with /)
    let sandpackPath = path.startsWith("/") ? path : `/${path}`;
    
    // Handle common path patterns
    if (sandpackPath.startsWith("/src/")) {
      sandpackPath = sandpackPath.replace("/src/", "/");
    }
    
    // Check if this is the App component
    if (sandpackPath.includes("App.tsx") || sandpackPath.includes("App.jsx")) {
      hasAppComponent = true;
      sandpackFiles["/App.tsx"] = content;
    } else if (sandpackPath.endsWith(".css")) {
      // Merge CSS files
      sandpackFiles["/styles.css"] += `\n/* ${path} */\n${content}`;
    } else if (sandpackPath.endsWith(".tsx") || sandpackPath.endsWith(".jsx") || 
               sandpackPath.endsWith(".ts") || sandpackPath.endsWith(".js")) {
      sandpackFiles[sandpackPath] = content;
    }
  });

  // Create default App if none exists
  if (!hasAppComponent) {
    const componentFiles = files.filter(f => 
      (f.file_path.endsWith(".tsx") || f.file_path.endsWith(".jsx")) &&
      !f.file_path.includes("index")
    );

    if (componentFiles.length > 0) {
      // Import and render the first component
      const firstComponent = componentFiles[0];
      const componentName = firstComponent.file_path
        .split("/")
        .pop()
        ?.replace(/\.(tsx|jsx)$/, "") || "Component";
      
      sandpackFiles["/App.tsx"] = `
import React from "react";
import ${componentName} from "./${componentName}";

export default function App() {
  return (
    <div className="min-h-screen">
      <${componentName} />
    </div>
  );
}
`;
    } else {
      // No components - show placeholder
      sandpackFiles["/App.tsx"] = `
import React from "react";

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Vista Previa
        </h1>
        <p className="text-gray-600">
          Genera código con un prompt para ver la vista previa aquí.
        </p>
      </div>
    </div>
  );
}
`;
    }
  }

  return sandpackFiles;
}

// Toolbar component inside Sandpack context
function PreviewToolbar({ 
  viewport, 
  setViewport, 
  showConsole, 
  setShowConsole 
}: { 
  viewport: ViewportSize;
  setViewport: (v: ViewportSize) => void;
  showConsole: boolean;
  setShowConsole: (v: boolean) => void;
}) {
  const { sandpack } = useSandpack();
  
  const handleRefresh = () => {
    sandpack.runSandpack();
  };

  const handleOpenExternal = () => {
    // Open in a new window - Sandpack doesn't expose URLs directly
    // This is a placeholder for the concept
    window.open("about:blank", "_blank");
  };

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
      <div className="flex items-center gap-1">
        <Button
          variant={viewport === "desktop" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewport("desktop")}
          title="Desktop"
        >
          <Monitor className="w-4 h-4" />
        </Button>
        <Button
          variant={viewport === "tablet" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewport("tablet")}
          title="Tablet"
        >
          <Tablet className="w-4 h-4" />
        </Button>
        <Button
          variant={viewport === "mobile" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewport("mobile")}
          title="Mobile"
        >
          <Smartphone className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant={showConsole ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowConsole(!showConsole)}
          title="Consola"
        >
          <Terminal className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleRefresh}
          title="Refrescar"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleOpenExternal}
          title="Abrir en nueva pestaña"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function LivePreview({ files, onError }: LivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [showConsole, setShowConsole] = useState(false);

  const sandpackFiles = useMemo(() => transformFilesToSandpack(files), [files]);

  const dependencies = {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.462.0",
    "framer-motion": "^12.0.0",
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <SandpackProvider
        template="react-ts"
        files={sandpackFiles}
        customSetup={{
          dependencies,
        }}
        options={{
          externalResources: [
            "https://cdn.tailwindcss.com",
          ],
          recompileMode: "delayed",
          recompileDelay: 500,
        }}
        theme="auto"
      >
        <PreviewToolbar 
          viewport={viewport} 
          setViewport={setViewport}
          showConsole={showConsole}
          setShowConsole={setShowConsole}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div 
            className="flex-1 flex justify-center bg-secondary/30 overflow-auto p-4"
            style={{ minHeight: showConsole ? "60%" : "100%" }}
          >
            <div
              style={{
                width: VIEWPORT_SIZES[viewport].width,
                maxWidth: "100%",
                height: "100%",
                transition: "width 0.3s ease",
              }}
              className="bg-background rounded-lg shadow-lg overflow-hidden border border-border"
            >
              <SandpackPreview
                showNavigator={false}
                showRefreshButton={false}
                showOpenInCodeSandbox={false}
                style={{ height: "100%" }}
              />
            </div>
          </div>
          
          {showConsole && (
            <div className="h-[40%] border-t border-border bg-background">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground">Consola</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowConsole(false)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <SandpackConsole style={{ height: "calc(100% - 32px)" }} />
            </div>
          )}
        </div>
      </SandpackProvider>
    </div>
  );
}
