import { motion } from "framer-motion";
import { 
  Layout, 
  Database, 
  Cloud, 
  GitBranch, 
  Users, 
  Sparkles,
  Zap,
  Shield
} from "lucide-react";

const features = [
  {
    icon: Layout,
    title: "Panel de Control Unificado",
    description: "Dashboard centralizado que conecta todas tus herramientas de desarrollo con sincronización en tiempo real.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Sparkles,
    title: "Frontend Ampliado",
    description: "Conexión nativa con Figma, React, Vue, Angular. Importación automática de componentes a código.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Database,
    title: "Ecosistema Backend",
    description: "PostgreSQL, MongoDB, Redis integrados. Migración de esquemas y herramientas visuales de gestión.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Cloud,
    title: "Multi-Cloud Nativo",
    description: "AWS, Google Cloud, Azure, DigitalOcean. Configuración visual de servicios y despliegue automático.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: GitBranch,
    title: "DevOps Integrado",
    description: "GitHub, GitLab, CI/CD visual. Pipelines configurables y rollback con un solo clic.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Shield,
    title: "Seguridad Avanzada",
    description: "Auth0, Firebase Auth, OAuth, JWT. Panel de gestión de usuarios y permisos centralizado.",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: Users,
    title: "Colaboración en Equipo",
    description: "Espacios compartidos, pair programming remoto, integración con Jira, Trello y Asana.",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "IA Integrada",
    description: "Generación de código con IA, sugerencias de optimización y detección de patrones.",
    color: "from-violet-500 to-purple-500",
  },
];

const Features = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(175_80%_50%_/_0.03)_0%,_transparent_50%)]" />
      
      <div className="container px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-mono text-sm tracking-wider uppercase">Características</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Todo lo que necesitas,{" "}
            <span className="gradient-text">en un solo lugar</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Un ecosistema completo que integra todas las etapas del desarrollo de software.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group glass-card rounded-xl p-6 hover:border-primary/30 transition-all duration-300"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} p-2.5 mb-5`}>
                <feature.icon className="w-full h-full text-white" />
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;