/**
 * Versión visible del producto y hoja de ruta.
 * Actualiza este archivo en cada cambio relevante de la plataforma.
 */
export const APP_VERSION = "1.4.0";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.4.0",
    date: "2026-03-09",
    changes: [
      "Asistente virtual con conocimiento completo de la plataforma y respuestas en vivo",
      "Vista previa con navegación entre páginas, pantalla completa y apertura en pestaña aparte",
      "Generación de código más robusta: historial de versiones, límites seguros y reintento automático",
      "Importación de repositorios de GitHub y administración de Proyectos Destacados",
      "Auditoría interna: limpieza de código duplicado, tipos y manejo de errores unificado",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-02-20",
    changes: [
      "Visor de sitios externos en /view",
      "Portafolio público con proyectos destacados",
      "Biblioteca de snippets reutilizables",
    ],
  },
];

export const ROADMAP: string[] = [
  "Sincronizar cambios de vuelta a GitHub en una rama nueva",
  "Colaboración en tiempo real dentro del editor",
  "Despliegue con un clic y dominios personalizados por proyecto",
  "Pruebas automáticas generadas por IA para cada proyecto",
];
