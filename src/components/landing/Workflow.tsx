import { motion } from "framer-motion";
import { 
  Lightbulb, 
  Palette, 
  Code, 
  Server, 
  TestTube, 
  Rocket, 
  Activity,
  ArrowRight
} from "lucide-react";

const steps = [
  {
    icon: Lightbulb,
    title: "Planificación",
    description: "Define tu proyecto con diagramas y user stories integrados.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Palette,
    title: "Diseño",
    description: "Crea interfaces en Figma con sincronización automática.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Code,
    title: "Frontend",
    description: "Arrastra componentes desde el diseño con código generado.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Server,
    title: "Backend",
    description: "Configura endpoints, bases de datos y lógica visualmente.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: TestTube,
    title: "Pruebas",
    description: "Ejecuta suites de tests con reporting centralizado.",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Rocket,
    title: "Despliegue",
    description: "Publica a cualquier plataforma con configuración visual.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Activity,
    title: "Monitoreo",
    description: "Supervisa rendimiento y errores desde el mismo panel.",
    color: "from-red-500 to-pink-500",
  },
];

const Workflow = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(280_70%_60%_/_0.05)_0%,_transparent_50%)]" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-mono text-sm tracking-wider uppercase">Flujo de Trabajo</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Del concepto a{" "}
            <span className="gradient-text">producción</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Un flujo continuo que elimina la fricción entre cada etapa del desarrollo.
          </p>
        </motion.div>

        {/* Workflow Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-6 lg:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Step Number */}
                <div className="absolute -top-2 -right-2 lg:top-0 lg:right-auto lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-4 w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-mono text-muted-foreground z-10">
                  {index + 1}
                </div>

                {/* Icon Container */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} p-4 mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-full h-full text-white" />
                </div>

                {/* Content */}
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Arrow (desktop only) */}
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-4 top-8 w-4 h-4 text-muted-foreground" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Workflow;