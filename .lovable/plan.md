# Plan de corrección

## 1. Chatbot Daro (prioridad alta)

**Problema:** `chat-assistant` exige JWT de usuario autenticado, pero el widget se usa en la landing por visitantes anónimos → 401 en todas las llamadas.

**Solución:**

- Quitar la validación `supabase.auth.getUser()` obligatoria en `supabase/functions/chat-assistant/index.ts`. La función ya está configurada como pública (`verify_jwt = false`) y solo lee proyectos públicos.
- Añadir rate limiting simple por IP (en memoria) para prevenir abuso: máx. 20 requests/minuto.
- Mantener sanitización de `currentPage` y el cap de 20 mensajes ya existente.
- Verificar que el modelo `google/gemini-3-flash-preview` sigue respondiendo (probar con `curl_edge_functions`).

## 2. Conexión con GitHub

**Problema:** botón silencioso porque falta `VITE_GITHUB_CLIENT_ID`, faltan secrets backend (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) y no existe la ruta de callback.

**Solución por pasos:**

### 2a. Manejo de errores visible

- En `ImportFromGitHubDialog` y en cualquier otro CTA de "Conectar GitHub": envolver `initiateOAuth()` en `try/catch` y mostrar `toast.error(...)` con instrucciones cuando falte la configuración.

### 2b. Crear ruta de callback OAuth

- Nueva página `src/pages/GitHubCallback.tsx` en la ruta `/api/github/callback` (montada en `App.tsx`) que:
  - Lee `code` y `state` del query string.
  - Llama `handleOAuthCallback(code, state)` de `useGitHub`.
  - Muestra estado (loading/éxito/error) y redirige a `/dashboard/projects` al terminar.

### 2c. Configuración requerida (acción del usuario)

El usuario debe:

1. Crear una **OAuth App** en GitHub → Settings → Developer settings → OAuth Apps:
  - Homepage URL: `https://darocodeia.com`
  - Authorization callback URL: `https://darocodeia.com/api/github/callback` (y el de preview)
2. Proporcionar:
  - `GITHUB_CLIENT_ID` (público, va al frontend como `VITE_GITHUB_CLIENT_ID`)
  - `GITHUB_CLIENT_SECRET` (privado, va a secrets del backend)

Tras confirmar, se guardarán los secrets correspondientes (frontend usa `import.meta.env.VITE_GITHUB_CLIENT_ID`; backend usa `Deno.env.get`).

## 3. Auditoría general

- Verificar que las edge functions GitHub (`github-auth`, `github-list-repos`, `github-import`, `github-push`) responden con CORS y errores genéricos correctos.
- Revisar `supabase/config.toml`: añadir bloques `verify_jwt = false` solo donde aplique públicamente; las funciones GitHub deben permanecer protegidas (requieren usuario).
- Probar cada función con `curl_edge_functions` para detectar errores 500 ocultos.
- Revisar consola del navegador buscando errores que el usuario no haya reportado.

## Archivos a tocar (estimado)

- `supabase/functions/chat-assistant/index.ts` (quitar auth obligatoria, añadir rate limit)
- `src/pages/GitHubCallback.tsx` (nuevo)
- `src/App.tsx` (registrar ruta callback)
- `src/components/dashboard/ImportFromGitHubDialog.tsx` (manejo de errores)
- `src/hooks/useGitHub.ts` (mensajes de error más claros)

## Preguntas para el usuario antes de implementar

1. ¿Confirmas que quieres que el chatbot sea **público** (cualquier visitante puede usarlo)? Es lo que estaba antes. 
2. ¿Ya tienes una **OAuth App de GitHub** creada? Si no, te indico los pasos exactos y luego pides los secrets.