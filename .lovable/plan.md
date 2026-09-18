# Editor a pantalla completa + Módulo de edición del sitio

## 1. Arreglar el visor cortado a la mitad

En el editor de proyectos, el bloque de código y la vista previa aparecen recortados: se ve solo la mitad superior y debajo queda un espacio negro vacío.

Causa confirmada: el contenedor que envuelve el editor y la vista previa no hereda la altura de la pantalla, así que sus paneles internos no tienen altura real y se cortan.

Qué se hará:
- Dar altura completa a la cadena de contenedores: área de pestañas, contenido de cada pestaña y el contenedor de la vista previa, para que todo ocupe el espacio disponible hasta la barra del prompt.
- Ajustar la división código/vista previa para que ambas columnas ocupen el 100% de la altura, con desplazamiento propio en lugar de recorte.
- Corregir la consola inferior para que reste altura en vez de solaparse.
- Revisar también las pestañas "Código" e "Historial" con el mismo criterio.
- Verificar en navegador con capturas a distintos tamaños (escritorio y ventana pequeña).

## 2. Módulo "Contenido del sitio" (solo super usuario)

Nuevo apartado en el panel, visible únicamente para iacristiandigital@gmail.com, para editar la propia página pública sin tocar código:

- **Textos y titulares**: título, subtítulo y botones del inicio, y los textos de cada sección (características, flujo, integraciones, llamada a la acción, pie de página), con campos en español e inglés.
- **Enlaces y contactos**: número de WhatsApp, enlaces del menú, del pie de página y redes.
- **Imágenes y logos**: subir logo, imágenes de secciones e imagen para compartir enlaces; se guardan en el almacenamiento público del proyecto.
- **Borrador y publicación**: se edita en borrador, hay vista previa del sitio con esos cambios y un botón "Publicar" que los pone en vivo. También "Descartar borrador" y "Volver a la versión publicada".
- Los "Proyectos Destacados" siguen en su pantalla actual; se añade un enlace desde el nuevo módulo para llegar allí.

Comportamiento en la web pública: si no hay contenido publicado, se muestran los textos actuales tal cual; al publicar, la web usa los valores editados.

## Detalles técnicos

- Nueva tabla `site_content`: `key`, `type` (text/link/image), `value_es`, `value_en`, `draft_es`, `draft_en`, `published_at`, `updated_by`. GRANT para `anon` (solo SELECT de publicado vía vista o filtro), `authenticated` y `service_role`.
- RLS: lectura pública de contenido publicado; escritura/lectura de borrador solo con `is_super_admin(auth.uid())`.
- Hook `useSiteContent(mode)` con caché de React Query; los componentes de la landing (`Hero`, `Features`, `Workflow`, `Integrations`, `CTA`, `Footer`, `Navbar`) leen del hook con los textos de `i18n` como valor por defecto.
- Imágenes al bucket `public-assets`, guardando la URL pública en `site_content`.
- Nueva ruta `/dashboard/site` protegida por `AuthGuard` + `useIsAdmin`, con vista previa en `?preview=draft`.
- Layout: aplicar `h-full`/`min-h-0` en `ProjectEditor.tsx` (Tabs, TabsContent) y en `LiveCodeEditor.tsx` (contenedor de Sandpack, columnas de editor y preview, consola).
