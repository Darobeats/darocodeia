/**
 * Registry of every piece of the public site the super admin can edit.
 * `key` is stable and stored in the `site_content` table.
 * When `i18nKey` is present the current translation is used as default value.
 */
export type SiteFieldType = "text" | "link" | "image";

export interface SiteField {
  key: string;
  type: SiteFieldType;
  label: string;
  i18nKey?: string;
  defaultEs?: string;
  defaultEn?: string;
  multiline?: boolean;
}

export interface SiteSection {
  id: string;
  title: string;
  description: string;
  fields: SiteField[];
}

export const SITE_SECTIONS: SiteSection[] = [
  {
    id: "brand",
    title: "Marca e imágenes",
    description: "Logo, nombre y la imagen que se ve al compartir el enlace.",
    fields: [
      { key: "brand.name", type: "text", label: "Nombre (primera parte)", defaultEs: "Daro", defaultEn: "Daro" },
      { key: "brand.nameAccent", type: "text", label: "Nombre (parte destacada)", defaultEs: "Code", defaultEn: "Code" },
      { key: "brand.logo", type: "image", label: "Logo" },
      { key: "brand.ogImage", type: "image", label: "Imagen al compartir enlaces" },
    ],
  },
  {
    id: "hero",
    title: "Portada",
    description: "Lo primero que se ve al entrar.",
    fields: [
      { key: "hero.badge", type: "text", label: "Etiqueta superior", i18nKey: "hero.badge" },
      { key: "hero.title1", type: "text", label: "Título (línea 1)", i18nKey: "hero.title1" },
      { key: "hero.title2", type: "text", label: "Título (línea 2 destacada)", i18nKey: "hero.title2" },
      { key: "hero.subtitle", type: "text", label: "Subtítulo", i18nKey: "hero.subtitle", multiline: true },
      { key: "hero.cta", type: "text", label: "Botón principal", i18nKey: "hero.cta" },
      { key: "hero.demo", type: "text", label: "Botón secundario", i18nKey: "hero.demo" },
      { key: "hero.stats.integrations", type: "text", label: "Dato 1", i18nKey: "hero.stats.integrations" },
      { key: "hero.stats.integrationsValue", type: "text", label: "Dato 1 (valor)", defaultEs: "50+", defaultEn: "50+" },
      { key: "hero.stats.developers", type: "text", label: "Dato 2", i18nKey: "hero.stats.developers" },
      { key: "hero.stats.developersValue", type: "text", label: "Dato 2 (valor)", defaultEs: "10K+", defaultEn: "10K+" },
      { key: "hero.stats.uptime", type: "text", label: "Dato 3", i18nKey: "hero.stats.uptime" },
      { key: "hero.stats.uptimeValue", type: "text", label: "Dato 3 (valor)", defaultEs: "99.9%", defaultEn: "99.9%" },
      { key: "hero.stats.support", type: "text", label: "Dato 4", i18nKey: "hero.stats.support" },
      { key: "hero.stats.supportValue", type: "text", label: "Dato 4 (valor)", defaultEs: "24/7", defaultEn: "24/7" },
    ],
  },
  {
    id: "features",
    title: "Sección de características",
    description: "Encabezado del bloque de características.",
    fields: [
      { key: "features.label", type: "text", label: "Etiqueta", i18nKey: "features.label" },
      { key: "features.title", type: "text", label: "Título", i18nKey: "features.title" },
      { key: "features.titleHighlight", type: "text", label: "Título destacado", i18nKey: "features.titleHighlight" },
      { key: "features.subtitle", type: "text", label: "Subtítulo", i18nKey: "features.subtitle", multiline: true },
    ],
  },
  {
    id: "workflow",
    title: "Flujo de trabajo",
    description: "Encabezado del bloque de proceso.",
    fields: [
      { key: "workflow.label", type: "text", label: "Etiqueta", defaultEs: "Flujo de Trabajo", defaultEn: "Workflow" },
      { key: "workflow.title", type: "text", label: "Título", defaultEs: "Del concepto a", defaultEn: "From concept to" },
      { key: "workflow.titleHighlight", type: "text", label: "Título destacado", defaultEs: "producción", defaultEn: "production" },
      {
        key: "workflow.subtitle",
        type: "text",
        label: "Subtítulo",
        multiline: true,
        defaultEs: "Un flujo continuo que elimina la fricción entre cada etapa del desarrollo.",
        defaultEn: "A continuous flow that removes friction between every development stage.",
      },
    ],
  },
  {
    id: "cta",
    title: "Llamada a la acción",
    description: "Bloque final antes del pie de página.",
    fields: [
      { key: "cta.title", type: "text", label: "Título", defaultEs: "Comienza a construir", defaultEn: "Start building" },
      { key: "cta.titleHighlight", type: "text", label: "Título destacado", defaultEs: "hoy mismo", defaultEn: "today" },
      {
        key: "cta.subtitle",
        type: "text",
        label: "Subtítulo",
        multiline: true,
        defaultEs: "El acceso a DaroCode es acompañado: cuéntanos tu proyecto y habilitamos tu cuenta.",
        defaultEn: "Access to DaroCode is guided: tell us about your project and we enable your account.",
      },
      { key: "cta.primary", type: "text", label: "Botón principal", defaultEs: "Solicitar acceso", defaultEn: "Request access" },
      { key: "cta.secondary", type: "text", label: "Botón de WhatsApp", defaultEs: "Escribir por WhatsApp", defaultEn: "Message on WhatsApp" },
      { key: "cta.trust", type: "text", label: "Texto de confianza", defaultEs: "Confiado por equipos en", defaultEn: "Trusted by teams at" },
    ],
  },
  {
    id: "footer",
    title: "Pie de página",
    description: "Descripción, estado y aviso legal.",
    fields: [
      { key: "footer.description", type: "text", label: "Descripción", i18nKey: "footer.description", multiline: true },
      { key: "footer.copyright", type: "text", label: "Aviso de copyright", i18nKey: "footer.copyright" },
      { key: "footer.systemStatus", type: "text", label: "Estado del sistema", i18nKey: "footer.systemStatus" },
      { key: "footer.allSystems", type: "text", label: "Mensaje de estado", i18nKey: "footer.allSystems" },
    ],
  },
  {
    id: "links",
    title: "Enlaces y contacto",
    description: "WhatsApp, menú y destinos de los botones.",
    fields: [
      { key: "contact.whatsappNumber", type: "text", label: "WhatsApp (solo números, con indicativo)", defaultEs: "573204963384", defaultEn: "573204963384" },
      { key: "contact.whatsappDisplay", type: "text", label: "WhatsApp (como se muestra)", defaultEs: "+57 320 496 3384", defaultEn: "+57 320 496 3384" },
      { key: "links.nav1.label", type: "text", label: "Menú 1 · texto", i18nKey: "nav.product" },
      { key: "links.nav1.href", type: "link", label: "Menú 1 · destino", defaultEs: "#portfolio", defaultEn: "#portfolio" },
      { key: "links.nav2.label", type: "text", label: "Menú 2 · texto", i18nKey: "nav.features" },
      { key: "links.nav2.href", type: "link", label: "Menú 2 · destino", defaultEs: "#features", defaultEn: "#features" },
      { key: "links.nav3.label", type: "text", label: "Menú 3 · texto", i18nKey: "nav.integrations" },
      { key: "links.nav3.href", type: "link", label: "Menú 3 · destino", defaultEs: "#integrations", defaultEn: "#integrations" },
      { key: "links.nav4.label", type: "text", label: "Menú 4 · texto", i18nKey: "nav.docs" },
      { key: "links.nav4.href", type: "link", label: "Menú 4 · destino", defaultEs: "/docs", defaultEn: "/docs" },
      { key: "links.primaryCta.label", type: "text", label: "Botón del menú · texto", defaultEs: "Solicitar acceso", defaultEn: "Request access" },
      { key: "links.primaryCta.href", type: "link", label: "Botón del menú · destino", defaultEs: "/solicitar-acceso", defaultEn: "/solicitar-acceso" },
      { key: "links.heroSecondary.href", type: "link", label: "Botón secundario de portada · destino", defaultEs: "/docs", defaultEn: "/docs" },
    ],
  },
];

export const SITE_FIELDS: SiteField[] = SITE_SECTIONS.flatMap((s) => s.fields);

export function fieldSection(key: string): string {
  return SITE_SECTIONS.find((s) => s.fields.some((f) => f.key === key))?.id ?? "general";
}
