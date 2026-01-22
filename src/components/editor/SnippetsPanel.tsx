import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSnippets, Snippet } from "@/hooks/useSnippets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  Plus,
  Code,
  Copy,
  Trash2,
  Edit,
  Tag,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import SaveSnippetDialog from "./SaveSnippetDialog";
import CodeViewer from "./CodeViewer";

interface SnippetsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  selectedCode?: string;
}

export default function SnippetsPanel({
  isOpen,
  onClose,
  onInsert,
  selectedCode,
}: SnippetsPanelProps) {
  const {
    snippets,
    loading,
    deleteSnippet,
    incrementUsage,
    searchSnippets,
    getAllTags,
  } = useSnippets();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedSnippet, setExpandedSnippet] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);

  const filteredSnippets = searchSnippets(searchQuery).filter(
    (s) => !selectedTag || s.tags.includes(selectedTag)
  );

  const allTags = getAllTags();

  const handleInsert = async (snippet: Snippet) => {
    await incrementUsage(snippet.id);
    onInsert(snippet.code);
    toast.success("Snippet insertado");
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success("Código copiado al portapapeles");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSnippet(id);
      toast.success("Snippet eliminado");
    } catch {
      toast.error("Error al eliminar snippet");
    }
  };

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setShowSaveDialog(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-[450px] sm:w-[540px] p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              Mis Snippets
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100vh-80px)]">
            {/* Search and Actions */}
            <div className="p-4 space-y-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar snippets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant={selectedTag === null ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => setSelectedTag(null)}
                  >
                    Todos
                  </Badge>
                  {allTags.slice(0, 8).map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTag === tag ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Save Selected Code Button */}
              {selectedCode && (
                <Button
                  onClick={() => {
                    setEditingSnippet(null);
                    setShowSaveDialog(true);
                  }}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Guardar código seleccionado
                </Button>
              )}
            </div>

            {/* Snippets List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredSnippets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No hay snippets</p>
                    <p className="text-sm mt-1">
                      {searchQuery
                        ? "No se encontraron resultados"
                        : "Guarda código para reutilizarlo después"}
                    </p>
                  </div>
                ) : (
                  filteredSnippets.map((snippet) => (
                    <motion.div
                      key={snippet.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-secondary/30 rounded-lg border border-border overflow-hidden"
                    >
                      {/* Snippet Header */}
                      <div
                        className="p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() =>
                          setExpandedSnippet(
                            expandedSnippet === snippet.id ? null : snippet.id
                          )
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {snippet.title}
                            </h4>
                            {snippet.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {snippet.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {snippet.language}
                          </Badge>
                        </div>

                        {/* Tags and Meta */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {snippet.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span>{snippet.tags.slice(0, 2).join(", ")}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(snippet.created_at)}</span>
                          </div>
                          {snippet.usage_count > 0 && (
                            <span className="text-primary">
                              {snippet.usage_count} usos
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {expandedSnippet === snippet.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {/* Code Preview */}
                            <div className="max-h-48 overflow-auto border-t border-border">
                              <CodeViewer
                                code={snippet.code}
                                language={snippet.language}
                              />
                            </div>

                            {/* Actions */}
                            <div className="p-2 border-t border-border flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleInsert(snippet)}
                                className="flex-1"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Insertar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(snippet.code)}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(snippet)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(snippet.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Create New Button */}
            <div className="p-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEditingSnippet(null);
                  setShowSaveDialog(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear nuevo snippet
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <SaveSnippetDialog
        isOpen={showSaveDialog}
        onClose={() => {
          setShowSaveDialog(false);
          setEditingSnippet(null);
        }}
        initialCode={editingSnippet?.code || selectedCode || ""}
        editingSnippet={editingSnippet}
      />
    </>
  );
}
