
-- Fix 1: project_prompts INSERT policy - add project ownership check
DROP POLICY IF EXISTS "Users can create prompts for their projects" ON public.project_prompts;
CREATE POLICY "Users can create prompts for their projects"
  ON public.project_prompts FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = user_id) 
    AND (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()))
  );

-- Fix 2: Make project-assets bucket private
UPDATE storage.buckets SET public = false WHERE id = 'project-assets';

-- Fix 3: Replace storage policies with ownership-scoped ones
DROP POLICY IF EXISTS "Users can upload project assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view project assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their project assets" ON storage.objects;

CREATE POLICY "Users can upload their project assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their project assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own project assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
