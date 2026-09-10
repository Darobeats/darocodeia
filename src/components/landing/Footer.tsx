import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { DEFAULT_WHATSAPP_MESSAGE, whatsappLink } from "@/data/contact";

const contactLink = whatsappLink(DEFAULT_WHATSAPP_MESSAGE);

const socialLinks = [
  { icon: MessageCircle, href: contactLink, label: "WhatsApp", external: true },
];

const Footer = () => {
  const { t } = useLanguage();

  const footerLinks: Record<string, { label: string; href: string; external?: boolean }[]> = {
    [t("footer.product")]: [
      { label: t("footer.links.features"), href: "/#features" },
      { label: t("footer.links.integrations"), href: "/#integrations" },
      { label: t("footer.links.workflow"), href: "/#workflow" },
      { label: t("footer.links.portfolio"), href: "/#portfolio" },
    ],
    [t("footer.resources")]: [
      { label: t("footer.links.documentation"), href: "/docs" },
      { label: t("footer.links.apiReference"), href: "/docs" },
      { label: t("footer.links.guides"), href: "/docs" },
    ],
    [t("footer.company")]: [
      { label: t("footer.links.requestAccess"), href: "/solicitar-acceso" },
      { label: t("footer.links.login"), href: "/login" },
      { label: t("footer.links.contact"), href: contactLink, external: true },
    ],
  };

  return (
    <footer className="border-t border-border/30 bg-card/30 backdrop-blur-sm">
      <div className="container px-4 md:px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold">
                Daro<span className="text-primary">Code</span>
              </span>
            </a>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              {t("footer.description")}
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4 text-sm">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-6">
            <span className="text-sm text-muted-foreground">
              {t("footer.systemStatus")}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">{t("footer.allSystems")}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;