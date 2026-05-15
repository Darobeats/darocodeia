# Conectar GitHub para analizar y mejorar código con IA

## Estado actual

El proyecto **ya tiene** una integración con GitHub vía OAuth (`github_connections`, edge functions `github-auth` y `github-push`). Hoy solo se usa en una dirección: **exportar** un proyecto de DaroCode hacia un repo nuevo. No hay forma de **traer** un repo existente para analizarlo.

Lo que falta es: importar el contenido de un repo, mostrarlo en el editor, y permitir que la IA lo analice/modifique con la misma UX que ya existe en `ProjectEditor`.

## Qué se construirá

### 1. Importar repositorios desde GitHub
- Nuevo botón **"Importar desde GitHub"** en `Dashboard` / `Projects` (junto a "Crear proyecto").
- Diálogo `ImportFromGitHubDialog` que:
  - Si el usuario no tiene conexión GitHub → dispara el flujo OAuth ya existente (`useGitHub.initiateOAuth`).
  - Si está conectado → lista sus repos (públicos y privados a los que tenga acceso) con buscador.
  - Permite elegir branch (default branch por defecto).
  - Botón "Importar" lanza una nueva edge function `github-import`.

### 2. Edge function `github-import` (segura)
- Verifica JWT del usuario y que `github_connections.user_id = auth.uid()`.
- Lee el `access_token` solo en el servidor (ya está revocado del cliente por la migración de seguridad previa).
- Usa GitHub API: `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1` para obtener todos los paths.
- Descarga el contenido de cada archivo (`GET /repos/.../contents/{path}` o blobs API), filtrando binarios y archivos > 1 MB.
- Crea una fila en `projects` (con `user_id = auth.uid()`) y `bulk insert` en `project_files`.
- Guarda metadatos en `project_context` (repo url, owner, branch, último commit SHA) para futuros pulls/pushes.
- Devuelve `project_id` para redirigir a `/dashboard/projects/:id`.

### 3. Análisis y mejoras con IA (reutiliza lo existente)
Una vez importado, el usuario abre el `ProjectEditor` ya existente, que ya soporta:
- Visor de archivos, edición en vivo, diff viewer, historial de versiones.
- Chat con IA (`generate-code` edge function + Lovable AI Gateway, modelo `google/gemini-2.5-pro` por defecto) que puede leer el contexto del proyecto y proponer cambios.

Añadiremos en `ProjectContextPanel`:
- Badge "Importado de GitHub" con link al repo.
- Botón **"Analizar repositorio"** → envía al chat un prompt preconfigurado (estructura, stack detectado, riesgos, mejoras sugeridas).
- Botón **"Sincronizar cambios a GitHub"** → reutiliza `github-push` para commitear los cambios al mismo repo/branch (o a una branch nueva `darocode/<timestamp>` para no romper `main`).

### 4. Seguridad (no negociable)
- `access_token` permanece **solo en edge functions** (ya revocado del cliente).
- Toda llamada a GitHub se hace server-side; el cliente nunca ve el token.
- RLS existente en `projects` y `project_files` ya garantiza que cada usuario solo vea lo suyo.
- Validación con Zod en las edge functions (`repo`, `owner`, `branch`).
- Límite de tamaño por archivo y total para evitar abuso.
- CORS estricto y `verify_jwt` en code (los tokens GitHub nunca se loguean).

## Detalles técnicos

```text
[Dashboard] --(Importar)--> [ImportFromGitHubDialog]
                                    |
                       (si no conectado) -> OAuth GitHub (ya existe)
                                    |
                                    v
                       [edge: github-list-repos]  -> GitHub /user/repos
                                    |
                                    v
                       [edge: github-import]
                          - lee access_token del usuario
                          - baja tree + blobs
                          - INSERT projects + project_files
                                    |
                                    v
                       Redirect /dashboard/projects/:id
                                    |
                                    v
                       [ProjectEditor existente]
                          - Chat IA (generate-code)
                          - Diff / versiones
                          - "Sincronizar a GitHub" -> github-push
```

### Archivos nuevos
- `supabase/functions/github-list-repos/index.ts`
- `supabase/functions/github-import/index.ts`
- `src/components/dashboard/ImportFromGitHubDialog.tsx`
- `src/hooks/useGitHubRepos.ts`

### Archivos modificados
- `src/pages/Dashboard.tsx` y/o `src/pages/Projects.tsx` — botón "Importar desde GitHub".
- `src/components/editor/ProjectContextPanel.tsx` — badge + botones "Analizar" y "Sincronizar".
- `src/hooks/useGitHub.ts` — añadir `listRepos`, `importRepo`, `syncToRepo`.

### Migración DB
- Ninguna obligatoria. Opcional: añadir columnas `github_repo_owner`, `github_repo_name`, `github_branch`, `github_last_sha` en `projects` (o guardarlas en `project_context`). Recomiendo `project_context` para no tocar el schema principal.

## Limitaciones honestas
- Repos muy grandes (>500 archivos o >50 MB) tardarán; impondremos un límite y mostraremos progreso.
- Binarios (imágenes, fuentes) se omitirán del editor pero se podrán subir a `project-assets` si hace falta.
- La sincronización inversa (GitHub → DaroCode) será **manual** (botón "Volver a importar"); webhooks bidireccionales quedan fuera de este alcance.
