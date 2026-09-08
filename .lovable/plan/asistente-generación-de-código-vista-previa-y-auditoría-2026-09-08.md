# Asistente, generación de código, vista previa y auditoría

## Qué encontré (verificado)

- **El asistente no responde porque exige sesión y rechaza a quien pregunta.** Al llamar al servicio publicado responde "no autorizado" (401), incluso con la clave pública del sitio. Por eso ni los botones de sugerencias devuelven nada.
- **El modelo de IA configurado sí existe** (`google/gemini-3-flash-preview` aparece en el catálogo), así que el problema no era el modelo; aun así conviene pasar a uno más reciente y capaz.
- **La vista previa no puede navegar entre páginas.** El componente de previa mete todos los archivos en un solo espacio con una única pantalla de inicio y no incluye la librería de navegación (`react-router-dom`), así que cualquier proyecto con varias páginas no enruta.
- **Hay código duplicado y muerto.** `src/components/editor/LivePreview.tsx` (347 líneas) no se usa en ninguna parte y es casi idéntico a `src/components/editor/LiveCodeEditor.tsx`, que sí es el que se muestra. Contiene además un botón "abrir en otra pestaña" falso que abre una página en blanco.
- **Calidad de código:** 20 errores y 13 advertencias de linter (tipos `any` en proyectos, portafolio, destacados, login, registro y callback de GitHub; dependencias de efectos incompletas en el editor y en ajustes; interfaces vacías en dos componentes de interfaz) y dos registros de depuración olvidados en la función de extracción de webs.
- **La generación de código es de un solo intento:** manda todos los archivos del proyecto en cada petición, guarda archivo por archivo, y si la respuesta de la IA viene mal formada devuelve "éxito" con cero archivos creados.

## Qué haré

### 1. Asistente virtual (solo usuarios registrados, nivel alto)
- Exigir sesión iniciada en el servicio del asistente y validar al usuario en el servidor; límite de 30 mensajes por minuto por usuario.
- El chat enviará el token de la sesión del usuario. Si alguien no ha iniciado sesión, el chat mostrará un mensaje claro con enlace a iniciar sesión o registrarse, en lugar de quedarse callado.
- Ampliar el conocimiento del asistente: funciones reales del sitio, precios, rutas exactas, y guías paso a paso (crear cuenta, crear proyecto, generar código, importar desde GitHub, exportar, visor de enlaces, destacados).
- Actualizar el modelo a `google/gemini-3.8-flash` y mostrar en pantalla cualquier fallo del servicio de IA (créditos agotados, límite de uso) en vez de silenciarlo.
- Reponer (redeploy) el servicio, porque la versión publicada está desactualizada respecto al código del proyecto.

### 2. Vista previa: navegación completa + pantalla completa + pestaña aparte
- Añadir `react-router-dom` (y utilidades de estilo) a las dependencias de la previa.
- Conservar la estructura de carpetas del proyecto y detectar si el código usa navegación: si la usa y no crea su propio enrutador, envolver la aplicación automáticamente para que las rutas funcionen.
- Activar la barra de direcciones de la previa (ir atrás/adelante, escribir una ruta) para poder recorrer todas las páginas.
- Botón de pantalla completa (la previa ocupa todo el editor) y botón real de "abrir en otra pestaña" con la dirección de la previa.
- Recordar a la IA generadora que puede crear varias páginas con navegación, ya soportada por la previa.

### 3. Generación de código: preparada para crecer
- Guardar los archivos en un solo envío por lote en lugar de uno por uno.
- Limitar el tamaño del contexto enviado (archivos existentes) para que proyectos grandes no fallen ni encarezcan.
- Validar las rutas de archivo recibidas y rechazar rutas inseguras.
- Si la respuesta de la IA no se puede interpretar, pedir una corrección una vez y, si vuelve a fallar, informar el error en pantalla en vez de decir "listo" sin crear nada.
- Añadir una entrada al historial de versiones por cada archivo que la IA modifica.

### 4. Limpieza y auditoría interna
- Eliminar `LivePreview.tsx` (duplicado y muerto) y el botón falso que contiene.
- Unificar el código repetido de lectura del flujo de respuestas del chat.
- Corregir los tipos `any` señalados, las dependencias de efectos del editor y de ajustes, y las interfaces vacías.
- Quitar los registros de depuración de la función de extracción de webs.
- Revisar que ningún dato sensible salga al navegador y volver a ejecutar el análisis de seguridad al final.

### 5. Versión y hoja de ruta
- Añadir una versión visible del producto (v1.0.0) y un archivo de novedades con lo que trae y lo que viene: sincronización de cambios hacia GitHub, previas con varias páginas guardadas, colaboración en tiempo real y despliegue directo.

## Detalles técnicos

- `supabase/functions/chat-assistant/index.ts`: validación de JWT en código (`auth.getUser`), rechazo del token anónimo, rate limit por `user.id`, prompt ampliado, modelo `google/gemini-3.8-flash`, errores 402/429/5xx propagados.
- `src/hooks/useChatAssistant.ts`: obtener `supabase.auth.getSession()`, enviar `Bearer <access_token>`, manejar 401 con mensaje localizado; extraer el parseo SSE a una función reutilizable.
- `src/components/editor/LiveCodeEditor.tsx`: `customSetup.dependencies` con `react-router-dom`, `clsx`, `tailwind-merge`; `transformFilesToSandpack` conserva subcarpetas; envoltura condicional con `BrowserRouter` en `/index.tsx`; `SandpackPreview showNavigator`; estado `isFullscreen`; apertura externa vía `sandpack.clients[...].iframe.src`.
- `supabase/functions/generate-code/index.ts`: upsert por lote, recorte de contexto, validación de `file.path`, reintento de parseo, inserción en la tabla de versiones de archivo.
- Borrado de `src/components/editor/LivePreview.tsx`; correcciones de ESLint en los archivos listados.
- Al final: `tsgo` (tipos), `bunx vitest run` (pruebas) y nuevo escaneo de seguridad.
