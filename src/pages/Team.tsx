import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, UserPlus, Crown, Shield, User, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  avatar?: string;
}

const roleConfig = {
  owner: { label: "Propietario", icon: Crown, color: "text-yellow-500" },
  admin: { label: "Admin", icon: Shield, color: "text-primary" },
  member: { label: "Miembro", icon: User, color: "text-muted-foreground" },
};

export default function Team() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  // Current user as team member
  const teamMembers: TeamMember[] = [
    {
      id: user?.id || "1",
      name: user?.user_metadata?.full_name || user?.email || "Usuario",
      email: user?.email || "",
      role: "owner",
      avatar: user?.user_metadata?.avatar_url,
    },
  ];

  const handleInvite = () => {
    if (!inviteEmail) return;
    toast.info("Función de invitación próximamente disponible");
    setInviteEmail("");
    setInviteOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Equipo</h1>
              <p className="text-muted-foreground">
                Gestiona los miembros de tu equipo
              </p>
            </div>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Invitar miembro
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Invitar miembro al equipo</DialogTitle>
                <DialogDescription>
                  Envía una invitación por correo electrónico
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="correo@ejemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleInvite}>Enviar invitación</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Team Members */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Miembros ({teamMembers.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.map((member, index) => {
              const roleInfo = roleConfig[member.role];
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {member.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    <roleInfo.icon className={`w-3.5 h-3.5 ${roleInfo.color}`} />
                    {roleInfo.label}
                  </Badge>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-card/50 border-border mt-6">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p className="mb-2">
                La gestión de equipos con múltiples miembros estará disponible próximamente.
              </p>
              <p className="text-sm">
                Podrás invitar colaboradores, asignar roles y gestionar permisos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
