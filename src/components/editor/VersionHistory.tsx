import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  History,
  RotateCcw,
  Bot,
  User,
  RefreshCw,
  ChevronRight,
  File,
} from "lucide-react";
import { useFileVersions, FileVersion } from "@/hooks/useFileVersions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface VersionHistoryProps {
  projectId: string;
  selectedFileId?: string;
  selectedFilePath?: string;
  onRestore: (filePath: string, content: string) => Promise<void>;
  onSelectVersion: (version: FileVersion) => void;
}

export default function VersionHistory({
  projectId,
  selectedFileId,
  selectedFilePath,
  onRestore,
  onSelectVersion,
}: VersionHistoryProps) {
  const { getVersionsByFile, restoreVersion, loading } = useFileVersions(projectId);
  const [versionsByFile, setVersionsByFile] = useState<Record<string, FileVersion[]>>({});
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [projectId]);

  // Auto-expand the selected file
  useEffect(() => {
    if (selectedFilePath) {
      setExpandedFiles((prev) => new Set([...prev, selectedFilePath]));
    }
  }, [selectedFilePath]);

  const loadVersions = async () => {
    const grouped = await getVersionsByFile();
    setVersionsByFile(grouped);
  };

  const handleRestore = async (version: FileVersion) => {
    setRestoringId(version.id);
    await restoreVersion(version.id, onRestore);
    await loadVersions();
    setRestoringId(null);
  };

  const toggleFile = (filePath: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  const getChangeIcon = (changeType: string | null) => {
    switch (changeType) {
      case "ai_generated":
        return <Bot className="w-3.5 h-3.5 text-primary" />;
      case "restored":
        return <RefreshCw className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <User className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getChangeLabel = (changeType: string | null) => {
    switch (changeType) {
      case "ai_generated":
        return "Generado por IA";
      case "restored":
        return "Restaurado";
      default:
        return "Edición manual";
    }
  };

  const formatTime = (date: string | null) => {
    if (!date) return "Fecha desconocida";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  };

  const filePaths = Object.keys(versionsByFile).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Cargando historial...
      </div>
    );
  }

  if (filePaths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <History className="w-12 h-12 mb-4 opacity-50" />
        <p>No hay historial de versiones</p>
        <p className="text-sm mt-1">
          Las versiones se guardarán automáticamente al generar o editar código
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <History className="w-4 h-4" />
            Historial de versiones
          </h3>
          <Button variant="ghost" size="sm" onClick={loadVersions}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {filePaths.map((filePath) => {
          const versions = versionsByFile[filePath];
          const isExpanded = expandedFiles.has(filePath);
          const isSelectedFile = filePath === selectedFilePath;

          return (
            <div
              key={filePath}
              className={`border border-border rounded-lg overflow-hidden ${
                isSelectedFile ? "ring-1 ring-primary" : ""
              }`}
            >
              {/* File Header */}
              <button
                onClick={() => toggleFile(filePath)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
                <File className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate flex-1">
                  {filePath.split("/").pop()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {versions.length} versiones
                </span>
              </button>

              {/* Versions List */}
              {isExpanded && (
                <div className="divide-y divide-border">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className="px-3 py-2 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {getChangeIcon(version.change_type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">
                                v{version.version_number}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getChangeLabel(version.change_type)}
                              </span>
                            </div>
                            {version.change_description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {version.change_description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatTime(version.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onSelectVersion(version)}
                          >
                            Ver
                          </Button>
                          {index > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleRestore(version)}
                              disabled={restoringId === version.id}
                            >
                              {restoringId === version.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
