import { motion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(175_80%_50%_/_0.1)_0%,_transparent_50%)]" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-card rounded-3xl p-8 md:p-16 text-center max-w-4xl mx-auto border-primary/20"
        >
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent p-4 mx-auto mb-8">
            <Terminal className="w-full h-full text-primary-foreground" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Comienza a construir{" "}
            <span className="gradient-text">hoy mismo</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Únete a miles de desarrolladores que ya están transformando su flujo de trabajo 
            con el ecosistema de desarrollo más completo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="group px-8 py-6 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-[0_0_30px_hsl(175_80%_50%_/_0.3)] hover:shadow-[0_0_50px_hsl(175_80%_50%_/_0.5)]"
              asChild
            >
              <Link to="/register">
                Empezar gratis
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-6 text-lg font-semibold border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-primary/50 transition-all duration-300"
              asChild
            >
              <a href="mailto:ventas@darocode.com">Contactar ventas</a>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 pt-8 border-t border-border/30">
            <p className="text-sm text-muted-foreground mb-4">Confiado por equipos en</p>
            <div className="flex items-center justify-center gap-8 opacity-50">
              {["Startups", "Empresas", "Agencias", "Freelancers"].map((type) => (
                <span key={type} className="text-sm font-medium">{type}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;