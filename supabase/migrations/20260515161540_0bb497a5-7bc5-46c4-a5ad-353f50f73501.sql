
-- 1. Revoke client SELECT on access_token column (defense in depth)
REVOKE SELECT (access_token) ON public.github_connections FROM authenticated, anon;

-- 2. Drop misleading notifications INSERT policy (notifications are inserted via service role)
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- 3. Add UPDATE policy for project-assets storage bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users can update their own project assets'
  ) THEN
    CREATE POLICY "Users can update their own project assets"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'project-assets' AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = 'project-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

-- 4. Restrict listing of public-assets bucket (files still accessible via public URL).
-- Drop any broad SELECT policy that allows listing all files.
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND qual LIKE '%public-assets%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- 5. Revoke EXECUTE on SECURITY DEFINER functions from anon (keep for authenticated/triggers)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
