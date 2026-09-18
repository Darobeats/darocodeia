CREATE TABLE public.site_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text','link','image')),
  section text NOT NULL DEFAULT 'general',
  label text,
  value_es text,
  value_en text,
  draft_es text,
  draft_en text,
  published_at timestamp with time zone,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published site content is readable by everyone"
ON public.site_content FOR SELECT TO anon, authenticated
USING (published_at IS NOT NULL);

CREATE POLICY "Super admin can read all site content"
ON public.site_content FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin can insert site content"
ON public.site_content FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin can update site content"
ON public.site_content FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin can delete site content"
ON public.site_content FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX site_content_section_idx ON public.site_content (section);