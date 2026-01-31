-- Add columns to projects table for public portfolio support
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS technologies TEXT[] DEFAULT '{}';

-- Create index for faster public projects queries
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON public.projects(is_public) WHERE is_public = true;

-- RLS policy to allow anyone to view public projects (even unauthenticated users)
CREATE POLICY "Public projects are viewable by everyone"
  ON public.projects
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);