import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface ProjectFile {
  id: string;
  file_path: string;
  content: string | null;
  language: string | null;
}

interface ExportOptions {
  includeReadme?: boolean;
  includePackageJson?: boolean;
  includeViteConfig?: boolean;
}

export function useExportProject() {
  const [isExporting, setIsExporting] = useState(false);

  const generateReadme = (projectName: string): string => {
    return `# ${projectName}

Este proyecto fue creado con DaroCode.

## Instalación

\`\`\`bash
npm install
\`\`\`

## Desarrollo

\`\`\`bash
npm run dev
\`\`\`

## Construcción

\`\`\`bash
npm run build
\`\`\`

## Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
`;
  };

  const generatePackageJson = (projectName: string): string => {
    return JSON.stringify(
      {
        name: projectName.toLowerCase().replace(/\s+/g, "-"),
        private: true,
        version: "0.1.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          lint: "eslint .",
          preview: "vite preview",
        },
        dependencies: {
          react: "^18.3.1",
          "react-dom": "^18.3.1",
          "lucide-react": "^0.400.0",
          "class-variance-authority": "^0.7.0",
          clsx: "^2.1.1",
          "tailwind-merge": "^2.3.0",
        },
        devDependencies: {
          "@types/react": "^18.3.3",
          "@types/react-dom": "^18.3.0",
          "@vitejs/plugin-react": "^4.3.1",
          autoprefixer: "^10.4.19",
          postcss: "^8.4.38",
          tailwindcss: "^3.4.4",
          typescript: "^5.2.2",
          vite: "^5.3.1",
        },
      },
      null,
      2
    );
  };

  const generateViteConfig = (): string => {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
`;
  };

  const generateTailwindConfig = (): string => {
    return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
  };

  const generateTsConfig = (): string => {
    return JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
          baseUrl: ".",
          paths: {
            "@/*": ["./src/*"],
          },
        },
        include: ["src"],
        references: [{ path: "./tsconfig.node.json" }],
      },
      null,
      2
    );
  };

  const generateIndexHtml = (projectName: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  };

  const exportAsZip = async (
    projectName: string,
    files: ProjectFile[],
    options: ExportOptions = {}
  ) => {
    const {
      includeReadme = true,
      includePackageJson = true,
      includeViteConfig = true,
    } = options;

    setIsExporting(true);

    try {
      const zip = new JSZip();
      const folderName = projectName.toLowerCase().replace(/\s+/g, "-");

      // Add project files
      files.forEach((file) => {
        if (file.content) {
          zip.file(`${folderName}/${file.file_path}`, file.content);
        }
      });

      // Add configuration files
      if (includeReadme) {
        zip.file(`${folderName}/README.md`, generateReadme(projectName));
      }

      if (includePackageJson) {
        zip.file(
          `${folderName}/package.json`,
          generatePackageJson(projectName)
        );
        zip.file(`${folderName}/tsconfig.json`, generateTsConfig());
        zip.file(`${folderName}/index.html`, generateIndexHtml(projectName));
      }

      if (includeViteConfig) {
        zip.file(`${folderName}/vite.config.ts`, generateViteConfig());
        zip.file(`${folderName}/tailwind.config.js`, generateTailwindConfig());
        zip.file(
          `${folderName}/postcss.config.js`,
          `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
        );
      }

      // Add .gitignore
      zip.file(
        `${folderName}/.gitignore`,
        `# Logs
logs
*.log
npm-debug.log*

# Dependencies
node_modules

# Build
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`
      );

      // Generate and download
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}.zip`);

      return true;
    } catch (error) {
      console.error("Error exporting project:", error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportAsZip,
    isExporting,
  };
}
