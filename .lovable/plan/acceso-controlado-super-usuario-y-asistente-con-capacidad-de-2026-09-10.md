# Acceso controlado, super usuario y asistente con capacidad de código

Tres cambios: un único super usuario con panel de administración de personas, cierre del registro libre con derivación a WhatsApp, y un asistente que puede proponer y aplicar cambios de código dentro de un proyecto.

## 1. Super usuario único

`iacristiandigital@gmail.com` será el único super usuario (hoy ya tiene rol de administrador en la plataforma).

Nueva sección **Usuarios** (solo visible para él) con:
- Lista de todas las personas de la plataforma: nombre, correo, fecha de alta, último acceso y cantidad de proyectos.
- Al abrir una persona: sus proyectos (nombre, estado, fecha), con acceso de solo lectura.
- **Agregar persona**: correo + contraseña inicial + nombre; la cuenta queda lista para entrar.
- **Restablecer contraseña**: dos opciones — definir una contraseña nueva en el momento, o enviarle un correo con enlace para que la cambie él mismo.
- **Eliminar persona**: con confirmación escrita del correo, y avisando que se borran también sus proyectos.
- Protección: nadie puede eliminarse a sí mismo ni quitarle el rol al super usuario.

Todo esto pasa por una función de servidor que verifica que quien llama sea realmente el super usuario; el navegador nunca recibe claves de administración.

## 2. Fuera el registro libre — todo hacia WhatsApp

- La página de registro deja de crear cuentas. Pasa a ser un **formulario de solicitud de acceso** (nombre, correo, empresa opcional, mensaje) que al enviarse abre WhatsApp al **+57 320 496 3384** con el mensaje ya redactado.
- Los botones "Empezar gratis" del inicio (portada, llamada final, barra superior, menú móvil) pasan a "Solicitar acceso" y llevan a esa página.
- Se quita el acceso con Google: solo entran cuentas creadas por el super usuario, con correo y contraseña.
- En la página de inicio de sesión, "¿No tienes cuenta?" pasa a "Solicitar acceso" (WhatsApp), no a registro.
- Se desactiva el auto-registro en el backend, así nadie puede crear cuentas por fuera de la interfaz.
- Se agrega un botón flotante discreto de WhatsApp en las páginas públicas.
- Se reemplaza el correo de "Contactar ventas" por el WhatsApp.

## 3. Asistente que trabaja sobre el código

El asistente flotante gana contexto y capacidad de acción cuando estás dentro de un proyecto:
- Reconoce en qué proyecto estás y qué archivos tiene.
- Puede **leer archivos**, **buscar** dentro del proyecto y **explicar** el código.
- Puede **proponer cambios**: muestra la lista de archivos que crearía o modificaría y el contenido; tú apruebas y solo entonces se guardan (con historial de versiones para revertir).
- Puede recibir prompts de generación como los del editor: si le pides "agrégame una página de contacto", arma la propuesta y espera tu confirmación.
- Fuera de un proyecto sigue respondiendo dudas de la plataforma como hasta ahora.

## Detalles técnicos

- Migración: tabla `access_requests` (nombre, correo, empresa, mensaje, estado) con lectura/gestión solo para admin e inserción pública controlada; GRANTs explícitos; función `is_super_admin()` en `SECURITY DEFINER` anclada al rol `admin`.
- Nueva edge function `admin-users` (acciones: `list`, `create`, `set_password`, `send_reset`, `delete`, `list_user_projects`): valida JWT, confirma rol `admin` vía `has_role`, usa `service_role` con `auth.admin.*`, valida entradas con Zod y devuelve errores genéricos.
- Nueva página `src/pages/AdminUsers.tsx` en `/dashboard/users`, protegida por `AuthGuard` + `useIsAdmin`; ítem en la barra lateral solo para admin.
- `Register.tsx` se convierte en `RequestAccess.tsx` (ruta `/solicitar-acceso`, con redirección desde `/register`): valida con Zod, inserta en `access_requests` y abre `https://wa.me/573204963384?text=` con `encodeURIComponent`.
- Se elimina `SocialLoginButtons` de Login; `supabase--configure_auth` con `disable_signup: true`.
- Constante única `WHATSAPP` en `src/data/contact.ts` usada por CTA, Navbar, Hero, Footer y el botón flotante.
- `chat-assistant`: se agregan herramientas (tool calling) `list_files`, `read_file`, `search_code` y `propose_changes`; las tres primeras leen `project_files` verificando pertenencia del proyecto al usuario; `propose_changes` devuelve la propuesta al cliente sin escribir. La aplicación de cambios reutiliza la lógica ya endurecida de `generate-code` (rutas seguras, límites de tamaño/cantidad, upsert por lote, registro en `file_versions`).
- UI del chat: tarjeta de propuesta con lista de archivos, vista del contenido y botones Aplicar / Descartar; se pasa `projectId` desde la ruta.
- Al cerrar: typecheck, lint, pruebas, despliegue de funciones y rescan de seguridad.

## Fuera de alcance

- Sincronización de vuelta hacia GitHub (sigue pendiente de las claves OAuth).
- Envío automático de mensajes por WhatsApp (se abre el chat con el texto listo, el envío lo hace la persona).
