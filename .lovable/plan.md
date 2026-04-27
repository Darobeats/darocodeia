## Issues found

**1. Featured project thumbnails are broken**

The thumbnails (`Chequi`, `TrueFlow`, `Carniceros`) point at:
```
https://uzzhucojelyovsowyavf.supabase.co/storage/v1/object/public/project-assets/thumbnails/...
```
A previous security fix (warn-level) flipped the `project-assets` bucket to **private**, so those `/object/public/...` URLs now return errors and the images don't render on the landing page.

**2. `iacristiandigital@gmail.com` cannot manage Featured Projects**

The user exists (`id = 68ca5575-3a7c-4363-8c67-ce902698196e`) but has no admin role, and the projects listed as featured belong to other users — so RLS blocks updates/deletes from this account. There is also no UI today to add/remove/reorder featured items.

---

## Plan

### A. Fix portfolio thumbnails (keep security intact)

Create a second, **public, read-only** bucket dedicated to public assets, and migrate the 3 thumbnail files there. The original `project-assets` bucket stays private for user uploads.

1. Migration:
   - Create bucket `public-assets` with `public = true`.
   - RLS on `storage.objects` for `public-assets`:
     - SELECT: anyone (`true`)
     - INSERT/UPDATE/DELETE: only users with role `admin`
2. Copy the 3 existing thumbnails (`chequi.png`, `trueflow.png`, `carniceros.png`) from `project-assets/thumbnails/` into `public-assets/thumbnails/` (one-off script using the service role key in an edge function or a quick admin upload — handled at implementation time).
3. UPDATE the 3 `projects.thumbnail_url` rows to point at `…/object/public/public-assets/thumbnails/<file>.png`.

Result: thumbnails render publicly again, and user-uploaded private content stays private.

### B. Admin role for `iacristiandigital@gmail.com`

1. Insert a row into `user_roles`: `(user_id = 68ca5575-3a7c-4363-8c67-ce902698196e, role = 'admin')`.
2. Add an RLS policy on `projects` so admins can `SELECT / UPDATE / DELETE / INSERT` any row using `public.has_role(auth.uid(), 'admin')`.

### C. Featured Projects admin UI

Add a new admin-only page **`/dashboard/featured`** (guarded by `has_role('admin')` checked client-side via a new `useIsAdmin` hook + redirect, with RLS as the real enforcement).

Page features:
- List all `projects` where `is_public = true`, ordered by a new `featured_order` column (see D).
- For each row: edit name / description / preview_url / thumbnail_url / technologies, plus toggle `is_public`, plus delete.
- "Add featured project" dialog: pick an existing public project OR create a new public-only entry (name, description, preview_url, thumbnail upload to `public-assets/thumbnails/`, technologies).
- Reorder via up/down buttons (mobile-friendly) writing to `featured_order`.

Entry point: a new "Proyectos Destacados" link in the dashboard sidebar, only rendered when `useIsAdmin()` is true.

### D. Ordering support

1. Migration: add `featured_order integer` to `projects` (nullable, default `null`). Backfill the 3 current featured rows with `1, 2, 3`.
2. Update `usePublicProjects` to `order('featured_order', { ascending: true, nullsFirst: false })` then by `updated_at` desc as a tiebreaker.

---

## Technical details

- New bucket policies use `public.has_role(auth.uid(), 'admin')` (already exists, `SECURITY DEFINER`) — no recursion risk.
- No changes to the existing private `project-assets` bucket or its policies.
- `useIsAdmin` hook: simple `select` on `user_roles` filtered by `auth.uid()` and `role = 'admin'`.
- Files to add: `src/hooks/useIsAdmin.ts`, `src/pages/FeaturedProjectsAdmin.tsx`, route in `src/App.tsx`, sidebar link update.
- Files to edit: `src/hooks/usePublicProjects.ts` (ordering), dashboard sidebar component.
- Migrations: one schema migration (bucket + policies + `featured_order` column + projects admin RLS), one data update (role insert + thumbnail URL rewrite + order backfill) via the insert tool.
