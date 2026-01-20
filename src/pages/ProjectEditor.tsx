import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  ArrowLeft,
  Send,
  Loader2,
  FileCode,
  FolderTree,
  MessageSquare,
  Code,
  Eye,
  Settings,
  Rocket,
  Plus,
  File,
  Folder,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import UrlPreviewCard, { DuplicationMode } from "@/components/editor/UrlPreviewCard";
import LivePreview from "@/components/editor/LivePreview";
import ProjectContextPanel from "@/components/editor/ProjectContextPanel";
import CodeViewer from "@/components/editor/CodeViewer";
import { useUrlDetection } from "@/hooks/useUrlDetection";
import { useProjectContext } from "@/hooks/useProjectContext";
import { firecrawlApi, ScrapedWebsite } from "@/lib/api/firecrawl";

interface ProjectPrompt {
  id: string;
  prompt: string;
  response: string | null;
  status: string;
  created_at: string;
}

interface ProjectFile {
  id: string;
  file_path: string;
  content: string | null;
  language: string | null;
}

export default function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [prompts, setPrompts] = useState<ProjectPrompt[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [promptInput, setPromptInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("code");
  const [showUrlPreview, setShowUrlPreview] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  
  const { learnFromWebsite, learnFromGeneration, formatContextForPrompt, fetchContext } = useProjectContext(id);
  const {
    detectedUrl,
    isAnalyzing,
    scrapedData,
    checkForUrl,
    analyzeUrl,
    clearUrl,
  } = useUrlDetection();

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchPrompts();
      fetchFiles();
      subscribeToPrompts();
    }
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [prompts]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      toast.error("Proyecto no encontrado");
      navigate("/dashboard/projects");
      return;
    }
    setProject(data);
    setLoading(false);
  };

  const fetchPrompts = async () => {
    const { data } = await supabase
      .from("project_prompts")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true });
    if (data) setPrompts(data);
  };

  const fetchFiles = async () => {
    const { data } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", id)
      .order("file_path", { ascending: true });
    if (data) {
      setFiles(data);
      if (data.length > 0 && !selectedFile) {
        setSelectedFile(data[0]);
      }
    }
  };

  const subscribeToPrompts = () => {
    const channel = supabase
      .channel(`prompts-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_prompts", filter: `project_id=eq.${id}` },
        () => {
          fetchPrompts();
          fetchFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Handle prompt input change - check for URLs
  const handlePromptInputChange = (value: string) => {
    setPromptInput(value);
    const url = checkForUrl(value);
    if (url && !showUrlPreview) {
      setShowUrlPreview(true);
      analyzeUrl(url);
    }
  };

  // Handle duplication from URL preview
  const handleDuplicate = async (mode: DuplicationMode) => {
    if (!scrapedData || !user) return;
    
    setShowUrlPreview(false);
    
    // Build enhanced prompt based on mode
    const enhancedPrompt = buildDuplicationPrompt(promptInput, scrapedData, mode);
    
    setPromptInput("");
    setIsGenerating(true);
    clearUrl();

    try {
      const { data: promptData, error: promptError } = await supabase
        .from("project_prompts")
        .insert({
          project_id: id,
          user_id: user.id,
          prompt: promptInput,
          status: "processing",
        })
        .select()
        .single();

      if (promptError) throw promptError;

      // Call edge function with website context
      const { data, error } = await supabase.functions.invoke("generate-code", {
        body: { 
          prompt: enhancedPrompt, 
          projectId: id, 
          promptId: promptData.id,
          existingFiles: files.map(f => ({ path: f.file_path, content: f.content })),
          websiteContext: {
            url: scrapedData.url,
            markdown: scrapedData.markdown,
            screenshot: scrapedData.screenshot,
            branding: scrapedData.branding,
            metadata: scrapedData.metadata,
          },
        },
      });

      if (error) throw error;

      await fetchPrompts();
      await fetchFiles();
      
      toast.success("Página duplicada correctamente");
    } catch (error) {
      console.error("Error duplicating page:", error);
      toast.error("Error al duplicar la página");
    } finally {
      setIsGenerating(false);
    }
  };

  // Build duplication prompt based on mode
  const buildDuplicationPrompt = (
    originalPrompt: string, 
    data: ScrapedWebsite, 
    mode: DuplicationMode
  ): string => {
    const brandingInfo = firecrawlApi.formatBrandingForPrompt(data.branding);
    
    let modeInstructions = "";
    switch (mode) {
      case "structure":
        modeInstructions = "Replica SOLO la estructura y layout de la página (componentes, secciones, disposición). Usa colores y contenido placeholder genérico.";
        break;
      case "content":
        modeInstructions = "Replica la estructura Y el contenido (textos, imágenes). Usa colores por defecto del proyecto.";
        break;
      case "full":
        modeInstructions = "Haz una réplica COMPLETA: estructura, contenido, colores exactos y tipografía. Debe verse lo más similar posible a la original.";
        break;
    }

    return `${originalPrompt}

=== INSTRUCCIONES DE DUPLICACIÓN ===
${modeInstructions}

=== INFORMACIÓN DE LA PÁGINA ORIGINAL ===
URL: ${data.url}
Título: ${data.metadata?.title || "Sin título"}
Descripción: ${data.metadata?.description || "Sin descripción"}

${brandingInfo ? `=== BRANDING EXTRAÍDO ===\n${brandingInfo}` : ""}

=== CONTENIDO DE LA PÁGINA ===
${data.markdown.slice(0, 8000)}
`;
  };

  const handleSendPrompt = async () => {
    if (!promptInput.trim() || isGenerating || !user) return;

    // Check if there's a URL - show preview instead of sending directly
    const url = checkForUrl(promptInput);
    if (url && !showUrlPreview) {
      setShowUrlPreview(true);
      analyzeUrl(url);
      return;
    }

    const prompt = promptInput.trim();
    setPromptInput("");
    setIsGenerating(true);

    try {
      // Create prompt record
      const { data: promptData, error: promptError } = await supabase
        .from("project_prompts")
        .insert({
          project_id: id,
          user_id: user.id,
          prompt,
          status: "processing",
        })
        .select()
        .single();

      if (promptError) throw promptError;

      // Call edge function to generate code
      const { data, error } = await supabase.functions.invoke("generate-code", {
        body: { 
          prompt, 
          projectId: id, 
          promptId: promptData.id,
          existingFiles: files.map(f => ({ path: f.file_path, content: f.content }))
        },
      });

      if (error) throw error;

      // Refresh data
      await fetchPrompts();
      await fetchFiles();
      
      toast.success("Código generado correctamente");
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("Error al generar código");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelUrlPreview = () => {
    setShowUrlPreview(false);
    clearUrl();
  };

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split(".").pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      css: "css",
      html: "html",
      json: "json",
      md: "markdown",
    };
    return langMap[ext || ""] || "plaintext";
  };

  const buildFileTree = (files: ProjectFile[]) => {
    const tree: Record<string, ProjectFile[]> = {};
    files.forEach((file) => {
      const parts = file.file_path.split("/");
      const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "root";
      if (!tree[folder]) tree[folder] = [];
      tree[folder].push(file);
    });
    return tree;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const fileTree = buildFileTree(files);

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/projects")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <FileCode className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold">{project?.name}</h1>
            <p className="text-xs text-muted-foreground">{project?.description || "Sin descripción"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowContextPanel(!showContextPanel)}
          >
            <Brain className="w-4 h-4 mr-2" />
            Memoria
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button size="sm">
            <Rocket className="w-4 h-4 mr-2" />
            Deploy
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Sidebar */}
        <aside className="w-64 border-r border-border bg-sidebar shrink-0 flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <FolderTree className="w-4 h-4" />
              Archivos
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {Object.keys(fileTree).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No hay archivos aún</p>
                  <p className="text-xs mt-1">Envía un prompt para generar código</p>
                </div>
              ) : (
                Object.entries(fileTree).map(([folder, folderFiles]) => (
                  <div key={folder} className="mb-2">
                    {folder !== "root" && (
                      <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
                        <Folder className="w-3.5 h-3.5" />
                        {folder}
                      </div>
                    )}
                    {folderFiles.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => setSelectedFile(file)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
                          selectedFile?.id === file.id
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        }`}
                      >
                        <File className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{file.file_path.split("/").pop()}</span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-border px-4">
              <TabsList className="bg-transparent h-10">
                <TabsTrigger value="code" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Código
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Vista previa
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Historial
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full bg-[#282c34]">
                {selectedFile ? (
                  <CodeViewer 
                    code={selectedFile.content || "// Archivo vacío"} 
                    language={selectedFile.language || "typescript"}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Selecciona un archivo para ver su contenido</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
              <ResizablePanelGroup direction="horizontal">
                {/* Code Panel */}
                <ResizablePanel defaultSize={40} minSize={20}>
                  <div className="h-full flex flex-col border-r border-border bg-[#282c34]">
                    <div className="px-3 py-2 border-b border-border bg-muted/30">
                      <span className="text-xs font-medium text-muted-foreground">
                        {selectedFile?.file_path.split("/").pop() || "Código"}
                      </span>
                    </div>
                    <ScrollArea className="flex-1">
                      {selectedFile ? (
                        <CodeViewer 
                          code={selectedFile.content || ""} 
                          language={selectedFile.language || "typescript"}
                        />
                      ) : (
                        <div className="p-4 text-muted-foreground text-sm">
                          Selecciona un archivo para ver el código
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </ResizablePanel>
                
                {/* Resizable Handle */}
                <ResizableHandle withHandle />
                
                {/* Preview Panel */}
                <ResizablePanel defaultSize={60} minSize={30}>
                  <LivePreview files={files} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {prompts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay mensajes aún</p>
                      <p className="text-sm mt-1">Envía tu primer prompt para comenzar</p>
                    </div>
                  ) : (
                    prompts.map((p) => (
                      <div key={p.id} className="space-y-3">
                        {/* User prompt */}
                        <div className="flex justify-end">
                          <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                            <p className="text-sm">{p.prompt}</p>
                          </div>
                        </div>
                        {/* AI response */}
                        {p.response && (
                          <div className="flex justify-start">
                            <div className="bg-secondary/50 rounded-lg px-4 py-2 max-w-[80%]">
                              <p className="text-sm whitespace-pre-wrap">{p.response}</p>
                            </div>
                          </div>
                        )}
                        {p.status === "processing" && (
                          <div className="flex justify-start">
                            <div className="bg-secondary/50 rounded-lg px-4 py-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="border-t border-border p-4 bg-background shrink-0">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* URL Preview Card */}
          <AnimatePresence>
            {showUrlPreview && detectedUrl && (
              <UrlPreviewCard
                url={detectedUrl}
                isLoading={isAnalyzing}
                scrapedData={scrapedData}
                onDuplicate={handleDuplicate}
                onCancel={handleCancelUrlPreview}
              />
            )}
          </AnimatePresence>

          {/* Input Row */}
          <div className="flex gap-3">
            <Input
              placeholder="Escribe tu prompt... Ej: Duplica https://stripe.com o Crea una landing page"
              value={promptInput}
              onChange={(e) => handlePromptInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendPrompt()}
              disabled={isGenerating}
              className="flex-1"
            />
            <Button onClick={handleSendPrompt} disabled={isGenerating || !promptInput.trim()}>
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
