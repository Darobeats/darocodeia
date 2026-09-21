-- Hide GitHub OAuth tokens from client-side reads: column-level grants only.
REVOKE SELECT ON public.github_connections FROM authenticated;
REVOKE SELECT ON public.github_connections FROM anon;
GRANT SELECT (id, user_id, github_username, token_expires_at, created_at, updated_at)
  ON public.github_connections TO authenticated;
-- Writes stay row-scoped through RLS; tokens are only written/read by edge functions.
GRANT INSERT, UPDATE, DELETE ON public.github_connections TO authenticated;
GRANT ALL ON public.github_connections TO service_role;

-- Public assets: allow public downloads by URL but block enumeration/listing.
DROP POLICY IF EXISTS "Public can list public assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view public assets" ON storage.objects;
DROP POLICY IF EXISTS "Public assets are publicly accessible" ON storage.objects;
CREATE POLICY "Admins can list public assets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'public-assets' AND public.has_role(auth.uid(), 'admin'));