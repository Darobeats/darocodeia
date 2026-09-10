import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail, User, Building2, MessageCircle } from "lucide-react";
import { WHATSAPP_DISPLAY, whatsappLink } from "@/data/contact";
import { getErrorMessage } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().trim().min(2, "Escribe tu nombre").max(120),
  email: z.string().trim().email("Correo no válido").max(255),
  company: z.string().trim().max(160).optional(),
  message: z.string().trim().max(1000).optional(),
});

const RequestAccess = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      full_name: fullName,
      email,
      company: company || undefined,
      message: message || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revisa los datos");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("access_requests").insert({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        company: parsed.data.company ?? null,
        message: parsed.data.message ?? null,
        status: "pending",
      });
      if (error) throw error;

      const text = [
        "Hola, quiero solicitar acceso a DaroCode.",
        `Nombre: ${parsed.data.full_name}`,
        `Correo: ${parsed.data.email}`,
        parsed.data.company ? `Empresa: ${parsed.data.company}` : null,
        parsed.data.message ? `Mensaje: ${parsed.data.message}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      setSent(true);
      window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
      toast.success("Solicitud enviada. Continúa la conversación por WhatsApp.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "No pudimos enviar tu solicitud"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-accent/10 via-background to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-8"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-primary-foreground">D</span>
          </div>
          <h3 className="text-2xl font-bold mb-4">Acceso por invitación</h3>
          <p className="text-muted-foreground max-w-md">
            DaroCode trabaja con acceso acompañado. Cuéntanos tu proyecto y
            habilitamos tu cuenta personalmente.
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            WhatsApp {WHATSAPP_DISPLAY}
          </p>
        </motion.div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm lg:w-96"
        >
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
            <h1 className="text-3xl font-bold">Solicitar acceso</h1>
            <p className="mt-2 text-muted-foreground">
              Déjanos tus datos y seguimos por WhatsApp. Si ya tienes cuenta,{" "}
              <Link to="/login" className="text-primary hover:underline">
                inicia sesión
              </Link>
              .
            </p>
          </div>

          {sent ? (
            <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-6 text-center">
              <p className="font-medium">¡Solicitud registrada!</p>
              <p className="text-sm text-muted-foreground">
                Si WhatsApp no se abrió automáticamente, usa este botón.
              </p>
              <Button className="w-full" asChild>
                <a
                  href={whatsappLink(
                    `Hola, soy ${fullName} (${email}) y solicité acceso a DaroCode.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Abrir WhatsApp
                </a>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre"
                    required
                    maxLength={120}
                    className="pl-10 bg-secondary/50 border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    maxLength={255}
                    className="pl-10 bg-secondary/50 border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa (opcional)</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Tu empresa"
                    maxLength={160}
                    className="pl-10 bg-secondary/50 border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">¿Qué quieres construir? (opcional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Cuéntanos brevemente tu proyecto"
                  maxLength={1000}
                  className="bg-secondary/50 border-border min-h-24"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Enviar y continuar por WhatsApp
                  </>
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RequestAccess;
