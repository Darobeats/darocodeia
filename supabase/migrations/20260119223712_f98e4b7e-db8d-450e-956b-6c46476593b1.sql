-- Create table for project prompts (AI conversation history)
CREATE TABLE public.project_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create table for project files (generated code)
CREATE TABLE public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT,
  language TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, file_path)
);

-- Enable RLS on both tables
ALTER TABLE public.project_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_prompts
CREATE POLICY "Users can view their own project prompts"
  ON public.project_prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create prompts for their projects"
  ON public.project_prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
  ON public.project_prompts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
  ON public.project_prompts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for project_files (check via project ownership)
CREATE POLICY "Users can view files of their projects"
  ON public.project_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_files.project_id 
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create files in their projects"
  ON public.project_files FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_files.project_id 
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update files in their projects"
  ON public.project_files FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_files.project_id 
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete files in their projects"
  ON public.project_files FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_files.project_id 
    AND projects.user_id = auth.uid()
  ));

-- Add indexes for performance
CREATE INDEX idx_project_prompts_project_id ON public.project_prompts(project_id);
CREATE INDEX idx_project_prompts_user_id ON public.project_prompts(user_id);
CREATE INDEX idx_project_files_project_id ON public.project_files(project_id);

-- Enable realtime for project_prompts
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_prompts;