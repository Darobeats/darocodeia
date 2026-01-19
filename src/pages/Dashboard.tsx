import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/hooks/useProjects";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { EditProjectDialog } from "@/components/dashboard/EditProjectDialog";
import { DeleteProjectDialog } from "@/components/dashboard/DeleteProjectDialog";
import { Project } from "@/hooks/useProjects";
import { 
  LayoutDashboard, FolderKanban, Users, BarChart3, Settings, Bell, 
  Search, LogOut, Plus, TrendingUp, GitCommit, Rocket, AlertCircle,
  Activity, Clock, CheckCircle2, MoreVertical, Pencil, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { projects, loading: projectsLoading, createProject, updateProject, deleteProject } = useProjects();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProjectState, setDeleteProjectState] = useState<Project | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Real-time notifications subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, 
        () => fetchNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada");
  };

  const stats = [
    { label: "Proyectos", value: projects.length, icon: FolderKanban, color: "text-primary" },
    { label: "Commits", value: projects.reduce((a, p) => a + (p.commits_count || 0), 0), icon: GitCommit, color: "text-green-400" },
    { label: "Deploys", value: projects.reduce((a, p) => a + (p.deploys_count || 0), 0), icon: Rocket, color: "text-blue-400" },
    { label: "Uptime", value: `${(projects.reduce((a, p) => a + (p.uptime_percentage || 100), 0) / (projects.length || 1)).toFixed(1)}%`, icon: TrendingUp, color: "text-accent" },
  ];

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Overview", active: true, path: "/dashboard" },
    { icon: FolderKanban, label: "Proyectos", path: "/dashboard/projects" },
    { icon: Users, label: "Equipo", path: "/dashboard" },
    { icon: BarChart3, label: "Analytics", path: "/dashboard" },
    { icon: Settings, label: "Configuración", path: "/dashboard" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-sidebar p-4">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold">D</span>
          </div>
          <span className="font-bold">Daro<span className="text-primary">Code</span></span>
        </Link>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => (
            <button 
              key={item.label} 
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${item.active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary">{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name || user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-10 bg-secondary/50" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setShowNotifications(!showNotifications)} className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}
              </Button>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 top-12 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-border"><h3 className="font-semibold">Notificaciones</h3></div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-muted-foreground">Sin notificaciones</p>
                    ) : notifications.map((n) => (
                      <button key={n.id} onClick={() => markAsRead(n.id)} className={`w-full p-4 text-left hover:bg-secondary/50 border-b border-border last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut}><LogOut className="w-5 h-5" /></Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Bienvenido de vuelta, {user?.user_metadata?.full_name || 'Usuario'}</p>
              </div>
              <Button className="bg-primary text-primary-foreground" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />Nuevo proyecto
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="bg-card/50 border-border">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-secondary/50 ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Projects & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-primary" />Proyectos recientes
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/projects")}>
                    Ver todos
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projects.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No hay proyectos aún. ¡Crea el primero!</p>
                      <Button variant="outline" onClick={() => setCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />Crear proyecto
                      </Button>
                    </div>
                  ) : projects.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold">{p.name[0]}</div>
                        <div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.commits_count || 0} commits</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${p.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>{p.status}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem onClick={() => setEditProject(p)}>
                              <Pencil className="w-4 h-4 mr-2" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteProjectState(p)} className="text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Actividad reciente</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: CheckCircle2, text: "Deploy completado", time: "hace 2h", color: "text-green-400" },
                    { icon: GitCommit, text: "3 commits fusionados", time: "hace 4h", color: "text-blue-400" },
                    { icon: AlertCircle, text: "Error detectado en prod", time: "hace 6h", color: "text-destructive" },
                    { icon: Clock, text: "Pipeline ejecutado", time: "hace 1d", color: "text-muted-foreground" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <div className="flex-1"><p className="text-sm">{item.text}</p></div>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Dialogs */}
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={createProject}
      />
      <EditProjectDialog
        open={!!editProject}
        onOpenChange={(open) => !open && setEditProject(null)}
        project={editProject}
        onSubmit={updateProject}
      />
      <DeleteProjectDialog
        open={!!deleteProjectState}
        onOpenChange={(open) => !open && setDeleteProjectState(null)}
        project={deleteProjectState}
        onConfirm={deleteProject}
      />
    </div>
  );
};

export default Dashboard;
