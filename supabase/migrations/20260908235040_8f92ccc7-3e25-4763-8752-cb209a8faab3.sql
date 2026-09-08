-- 1) github_connections: remove client read access to access_token
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.github_connections FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.github_connections FROM authenticated;

GRANT SELECT (id, user_id, github_username, token_expires_at, created_at, updated_at) ON public.github_connections TO authenticated;
GRANT INSERT (id, user_id, github_username, access_token, token_expires_at) ON public.github_connections TO authenticated;
GRANT UPDATE (github_username, token_expires_at, updated_at) ON public.github_connections TO authenticated;
GRANT DELETE ON public.github_connections TO authenticated;
GRANT ALL ON public.github_connections TO service_role;

-- 2) file_versions: ensure file_id belongs to the same project
DROP POLICY IF EXISTS "Users can create versions for their project files" ON public.file_versions;
CREATE POLICY "Users can create versions for their project files"
ON public.file_versions
FOR INSERT
TO authenticated
WITH CHECK (
  project_id IN (SELECT p.id FROM public.projects p WHERE p.user_id = auth.uid())
  AND (
    file_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.project_files pf
      WHERE pf.id = file_versions.file_id
        AND pf.project_id = file_versions.project_id
    )
  )
);

DROP POLICY IF EXISTS "Users can view versions of their project files" ON public.file_versions;
CREATE POLICY "Users can view versions of their project files"
ON public.file_versions
FOR SELECT
TO authenticated
USING (
  project_id IN (SELECT p.id FROM public.projects p WHERE p.user_id = auth.uid())
  AND (
    file_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.project_files pf
      WHERE pf.id = file_versions.file_id
        AND pf.project_id = file_versions.project_id
    )
  )
);

GRANT SELECT, INSERT, DELETE ON public.file_versions TO authenticated;
GRANT ALL ON public.file_versions TO service_role;