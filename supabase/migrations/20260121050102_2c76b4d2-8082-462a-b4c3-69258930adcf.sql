-- Create file_versions table for version history
CREATE TABLE public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.project_files(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  change_type TEXT DEFAULT 'manual',
  change_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Create indexes for performance
CREATE INDEX idx_file_versions_file_id ON public.file_versions(file_id);
CREATE INDEX idx_file_versions_project_id ON public.file_versions(project_id);
CREATE INDEX idx_file_versions_created_at ON public.file_versions(created_at DESC);

-- Enable RLS
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view versions of their project files"
  ON public.file_versions FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for their project files"
  ON public.file_versions FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete versions of their project files"
  ON public.file_versions FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );