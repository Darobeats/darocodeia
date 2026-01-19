import { Project } from "@/hooks/useProjects";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Pencil,
  Copy,
  Archive,
  Trash2,
  GitCommit,
  Rocket,
  AlertCircle,
  Activity,
  Folder,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDuplicate: (project: Project) => void;
  onArchive: (project: Project) => void;
  onDelete: (project: Project) => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Activo", variant: "default" },
  paused: { label: "Pausado", variant: "secondary" },
  archived: { label: "Archivado", variant: "outline" },
};

export function ProjectCard({
  project,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: ProjectCardProps) {
  const navigate = useNavigate();
  const status = statusConfig[project.status || "active"] || statusConfig.active;
  const timeAgo = project.updated_at
    ? formatDistanceToNow(new Date(project.updated_at), {
        addSuffix: true,
        locale: es,
      })
    : "N/A";

  const handleCardClick = () => {
    navigate(`/dashboard/projects/${project.id}`);
  };

  return (
    <Card 
      className="bg-card/50 border-border hover:border-primary/30 transition-all duration-200 group cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {project.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {project.description || "Sin descripción"}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(project); }}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(project); }}>
                <Archive className="w-4 h-4 mr-2" />
                {project.status === "archived" ? "Desarchivar" : "Archivar"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <GitCommit className="w-4 h-4" />
              {project.commits_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Rocket className="w-4 h-4" />
              {project.deploys_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {project.errors_count || 0}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            {project.uptime_percentage ?? 100}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant={status.variant}>{status.label}</Badge>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </CardContent>
    </Card>
  );
}
