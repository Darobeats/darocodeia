# Integrar el Visor web (/view) al panel y limpiar su vista

## Objetivo
Que el usuario pueda abrir el visor de sitios (`/view`) desde su panel, y que al navegar con él se vea la página externa de forma natural dentro de darocodeia.com, sin el chatbot flotante ni elementos de la landing.

## Cambios

### 1. Acceso desde el panel del usuario
- En `src/pages/Dashboard.tsx`, agregar al menú lateral un ítem "Visor web" (icono `Globe` ya importado) que navega a `/view`.
- Ubicarlo junto a "Proyectos", visible para todos los usuarios (no solo admin).

### 2. Ocultar el chatbot en el visor
- En `src/App.tsx`, el `ChatWidget` hoy se renderiza en todas las rutas. Envolverlo en un componente que use `useLocation()` y no lo muestre cuando la ruta empiece por `/view`.
- Así el botón flotante y la ventana de chat no aparecen sobre la página embebida.

### 3. Vista limpia del visor
- La ruta `/view/*` ya renderiza solo `EmbedViewer` (sin Navbar ni Hero de la landing), así que no hay cambio de estructura.
- Verificar que en `/view` no aparezca ningún recuadro de la sección Hero ni otros elementos de la portada; si alguno se filtra, se excluye en esa ruta.
- Mantener la barra superior mínima del visor (campo de URL, botones Ir / copiar / abrir en pestaña nueva), que es la navegación propia del visor.

### 4. Verificación
- `bunx tsgo --noEmit` sin errores.
- Prueba en el navegador: desde `/dashboard` abrir "Visor web", ingresar una URL, confirmar que la página se ve a pantalla completa, sin chatbot y sin elementos de la landing.

## Detalles técnicos
- `src/App.tsx`: nuevo wrapper `ChatWidgetGate` dentro de `BrowserRouter` que lee `location.pathname` y retorna `null` en `/view/*`.
- `src/pages/Dashboard.tsx`: una línea adicional en `sidebarItems` (`{ icon: Globe, label: "Visor web", path: "/view" }`).
- Sin cambios de base de datos ni de backend.
