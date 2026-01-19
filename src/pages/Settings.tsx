import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Bell, Shield, Loader2, Save, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  website: string | null;
  github_username: string | null;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    avatar_url: "",
    bio: "",
    company: "",
    location: "",
    website: "",
    github_username: "",
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email_updates: true,
    deploy_alerts: true,
    error_alerts: true,
    weekly_digest: false,
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setProfile({
          full_name: data.full_name || user.user_metadata?.full_name || "",
          avatar_url: data.avatar_url || user.user_metadata?.avatar_url || "",
          bio: data.bio || "",
          company: data.company || "",
          location: data.location || "",
          website: data.website || "",
          github_username: data.github_username || "",
        });
      } else {
        setProfile({
          full_name: user.user_metadata?.full_name || "",
          avatar_url: user.user_metadata?.avatar_url || "",
          bio: "",
          company: "",
          location: "",
          website: "",
          github_username: "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        ...profile,
        email: user.email,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Error al guardar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Sesión cerrada");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Configuración</h1>
            <p className="text-muted-foreground">Gestiona tu cuenta y preferencias</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Información del perfil</CardTitle>
                  <CardDescription>Actualiza tu información personal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {profile.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor="avatar_url">URL del avatar</Label>
                      <Input
                        id="avatar_url"
                        value={profile.avatar_url || ""}
                        onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                        placeholder="https://ejemplo.com/avatar.jpg"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Name & Bio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Nombre completo</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name || ""}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Empresa</Label>
                      <Input
                        id="company"
                        value={profile.company || ""}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Biografía</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio || ""}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Cuéntanos sobre ti..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {/* Location & Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        value={profile.location || ""}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        placeholder="Ciudad, País"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Sitio web</Label>
                      <Input
                        id="website"
                        value={profile.website || ""}
                        onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                        placeholder="https://tu-sitio.com"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="github_username">Usuario de GitHub</Label>
                    <Input
                      id="github_username"
                      value={profile.github_username || ""}
                      onChange={(e) => setProfile({ ...profile, github_username: e.target.value })}
                      placeholder="usuario"
                      className="mt-1"
                    />
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar cambios
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Preferencias de notificaciones</CardTitle>
                  <CardDescription>Configura cómo quieres recibir notificaciones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { key: "email_updates", label: "Actualizaciones por email", desc: "Recibe noticias y actualizaciones del producto" },
                    { key: "deploy_alerts", label: "Alertas de despliegue", desc: "Notificaciones cuando se completan los deploys" },
                    { key: "error_alerts", label: "Alertas de errores", desc: "Notificaciones cuando ocurren errores en producción" },
                    { key: "weekly_digest", label: "Resumen semanal", desc: "Recibe un resumen semanal de actividad" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, [item.key]: checked })
                        }
                      />
                    </div>
                  ))}

                  <Button onClick={() => toast.success("Preferencias guardadas")}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar preferencias
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Información de la cuenta</CardTitle>
                  <CardDescription>Detalles de tu cuenta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <p className="text-muted-foreground mt-1">{user?.email}</p>
                  </div>
                  <div>
                    <Label>ID de usuario</Label>
                    <p className="text-muted-foreground mt-1 text-sm font-mono">{user?.id}</p>
                  </div>
                  <div>
                    <Label>Cuenta creada</Label>
                    <p className="text-muted-foreground mt-1">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString("es") : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Zona de peligro</CardTitle>
                  <CardDescription>Acciones irreversibles de la cuenta</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
