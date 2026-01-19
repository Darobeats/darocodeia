import { motion } from "framer-motion";

const integrations = [
  { name: "React", category: "Frontend" },
  { name: "Vue", category: "Frontend" },
  { name: "Angular", category: "Frontend" },
  { name: "Next.js", category: "Frontend" },
  { name: "Figma", category: "Design" },
  { name: "AWS", category: "Cloud" },
  { name: "Google Cloud", category: "Cloud" },
  { name: "Azure", category: "Cloud" },
  { name: "PostgreSQL", category: "Database" },
  { name: "MongoDB", category: "Database" },
  { name: "Redis", category: "Database" },
  { name: "GitHub", category: "DevOps" },
  { name: "GitLab", category: "DevOps" },
  { name: "Docker", category: "DevOps" },
  { name: "Stripe", category: "Services" },
  { name: "Auth0", category: "Auth" },
];

const Integrations = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-mono text-sm tracking-wider uppercase">Integraciones</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Conecta con{" "}
            <span className="gradient-text">tus herramientas favoritas</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Más de 50 integraciones nativas con las plataformas más populares del ecosistema.
          </p>
        </motion.div>

        {/* Marquee Effect */}
        <div className="relative">
          {/* Gradient Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
          
          {/* First Row */}
          <motion.div
            className="flex gap-6 mb-6"
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...integrations, ...integrations].map((integration, index) => (
              <div
                key={`row1-${index}`}
                className="flex-shrink-0 glass-card rounded-xl px-6 py-4 flex items-center gap-3 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{integration.name[0]}</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">{integration.name}</div>
                  <div className="text-xs text-muted-foreground">{integration.category}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Second Row - Reverse */}
          <motion.div
            className="flex gap-6"
            animate={{ x: [-1000, 0] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          >
            {[...integrations.reverse(), ...integrations].map((integration, index) => (
              <div
                key={`row2-${index}`}
                className="flex-shrink-0 glass-card rounded-xl px-6 py-4 flex items-center gap-3 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-accent">{integration.name[0]}</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">{integration.name}</div>
                  <div className="text-xs text-muted-foreground">{integration.category}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;