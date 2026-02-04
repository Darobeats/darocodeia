import { motion } from "framer-motion";
import { 
  Layout, 
  Database, 
  Cloud, 
  GitBranch, 
  Users, 
  Sparkles,
  Zap,
  Shield,
  LucideIcon
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface FeatureConfig {
  icon: LucideIcon;
  key: string;
  color: string;
}

const featureConfigs: FeatureConfig[] = [
  { icon: Layout, key: "dashboard", color: "from-cyan-500 to-blue-500" },
  { icon: Sparkles, key: "frontend", color: "from-purple-500 to-pink-500" },
  { icon: Database, key: "backend", color: "from-green-500 to-emerald-500" },
  { icon: Cloud, key: "cloud", color: "from-orange-500 to-amber-500" },
  { icon: GitBranch, key: "devops", color: "from-blue-500 to-indigo-500" },
  { icon: Shield, key: "security", color: "from-red-500 to-rose-500" },
  { icon: Users, key: "team", color: "from-teal-500 to-cyan-500" },
  { icon: Zap, key: "ai", color: "from-violet-500 to-purple-500" },
];

const Features = () => {
  const { t } = useLanguage();

  return (
    <section id="features" className="py-24 md:py-32 relative overflow-hidden">
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
          <span className="text-primary font-mono text-sm tracking-wider uppercase">{t("features.label")}</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            {t("features.title")}{" "}
            <span className="gradient-text">{t("features.titleHighlight")}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("features.subtitle")}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureConfigs.map((feature, index) => (
            <motion.div
              key={feature.key}
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
                {t(`features.items.${feature.key}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(`features.items.${feature.key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;