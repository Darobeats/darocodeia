import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const navItems = [
    { label: t("nav.product"), href: "#" },
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.integrations"), href: "#integrations" },
    { label: t("nav.docs"), href: "/docs", isRoute: true },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-4 mt-4">
        <nav className="glass-card rounded-2xl border-border/30 px-6 py-4">
          <div className="container flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold">
                Daro<span className="text-primary">Code</span>
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                item.isRoute ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                )
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-2">
              <LanguageSelector />
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
                <Link to="/login">{t("common.login")}</Link>
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(175_80%_50%_/_0.2)]" asChild>
                <Link to="/register">{t("common.register")}</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSelector />
              <button
                className="p-2 text-foreground"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mx-4 mt-2"
          >
            <div className="glass-card rounded-2xl border-border/30 p-6">
              <div className="flex flex-col gap-4">
                {navItems.map((item) => (
                  item.isRoute ? (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="text-foreground py-2 border-b border-border/30 last:border-0"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      className="text-foreground py-2 border-b border-border/30 last:border-0"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </a>
                  )
                ))}
                <div className="flex flex-col gap-2 pt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/login">{t("common.login")}</Link>
                  </Button>
                  <Button className="w-full bg-primary text-primary-foreground" asChild>
                    <Link to="/register">{t("common.register")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;