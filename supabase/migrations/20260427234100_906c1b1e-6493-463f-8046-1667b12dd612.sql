-- A. Public assets bucket for site-wide public images
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read
CREATE POLICY "Public assets are readable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-assets');

-- Admin write
CREATE POLICY "Admins can upload public assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update public assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete public assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets' AND public.has_role(auth.uid(), 'admin'));

-- D. Ordering column
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS featured_order INTEGER;
CREATE INDEX IF NOT EXISTS idx_projects_featured_order ON public.projects(featured_order) WHERE is_public = true;

-- B. Admin RLS on projects
CREATE POLICY "Admins can view all projects"
ON public.projects FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert any project"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any project"
ON public.projects FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any project"
ON public.projects FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));