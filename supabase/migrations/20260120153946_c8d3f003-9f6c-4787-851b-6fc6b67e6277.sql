-- Create project_context table for AI memory
CREATE TABLE public.project_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, context_type, key)
);

-- Enable RLS
ALTER TABLE public.project_context ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can manage context of their own projects
CREATE POLICY "Users can view their project context"
  ON public.project_context
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create project context"
  ON public.project_context
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their project context"
  ON public.project_context
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their project context"
  ON public.project_context
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_project_context_updated_at
  BEFORE UPDATE ON public.project_context
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();