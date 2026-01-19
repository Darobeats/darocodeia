import { motion } from "framer-motion";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  GitCommit,
  Rocket,
  AlertCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Analytics() {
  const navigate = useNavigate();
  const { projects, loading } = useProjects();

  // Calculate stats
  const totalCommits = projects.reduce((a, p) => a + (p.commits_count || 0), 0);
  const totalDeploys = projects.reduce((a, p) => a + (p.deploys_count || 0), 0);
  const totalErrors = projects.reduce((a, p) => a + (p.errors_count || 0), 0);
  const avgUptime = projects.length
    ? (projects.reduce((a, p) => a + (p.uptime_percentage || 100), 0) / projects.length).toFixed(1)
    : "100.0";

  // Chart data
  const projectsData = projects.slice(0, 6).map((p) => ({
    name: p.name.length > 10 ? p.name.slice(0, 10) + "..." : p.name,
    commits: p.commits_count || 0,
    deploys: p.deploys_count || 0,
    errors: p.errors_count || 0,
  }));

  const statusData = [
    { name: "Activos", value: projects.filter((p) => p.status === "active").length, color: "hsl(var(--primary))" },
    { name: "Pausados", value: projects.filter((p) => p.status === "paused").length, color: "hsl(var(--muted-foreground))" },
    { name: "Archivados", value: projects.filter((p) => p.status === "archived").length, color: "hsl(var(--secondary))" },
  ].filter((d) => d.value > 0);

  const uptimeData = projects.slice(0, 7).map((p) => ({
    name: p.name.length > 8 ? p.name.slice(0, 8) + "..." : p.name,
    uptime: p.uptime_percentage || 100,
  }));

  const stats = [
    { label: "Total Commits", value: totalCommits, icon: GitCommit, color: "text-green-400", trend: "+12%" },
    { label: "Total Deploys", value: totalDeploys, icon: Rocket, color: "text-blue-400", trend: "+8%" },
    { label: "Errores", value: totalErrors, icon: AlertCircle, color: "text-destructive", trend: "-5%" },
    { label: "Uptime Promedio", value: `${avgUptime}%`, icon: Activity, color: "text-primary", trend: "+0.2%" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Métricas y estadísticas de tus proyectos</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className={`text-xs flex items-center gap-1 ${stat.trend.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                      {stat.trend.startsWith("+") ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Commits & Deploys by Project */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg">Actividad por Proyecto</CardTitle>
            </CardHeader>
            <CardContent>
              {projectsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={projectsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="commits" fill="hsl(var(--primary))" name="Commits" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deploys" fill="hsl(var(--accent))" name="Deploys" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No hay datos disponibles
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Status Distribution */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg">Estado de Proyectos</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No hay proyectos
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Uptime Chart */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Uptime por Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            {uptimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={uptimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis domain={[90, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Uptime"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="uptime"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
