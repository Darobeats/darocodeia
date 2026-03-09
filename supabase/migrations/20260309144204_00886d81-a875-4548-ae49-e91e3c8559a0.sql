
-- Drop all existing RESTRICTIVE policies and recreate as PERMISSIVE

-- ============ profiles ============
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- ============ projects ============
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;

CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public projects are viewable by everyone" ON public.projects FOR SELECT TO anon, authenticated USING (is_public = true);

-- ============ project_files ============
DROP POLICY IF EXISTS "Users can create files in their projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can delete files in their projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can update files in their projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can view files of their projects" ON public.project_files;

CREATE POLICY "Users can create files in their projects" ON public.project_files FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete files in their projects" ON public.project_files FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update files in their projects" ON public.project_files FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can view files of their projects" ON public.project_files FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid()));

-- ============ project_prompts ============
DROP POLICY IF EXISTS "Users can create prompts for their projects" ON public.project_prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.project_prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON public.project_prompts;
DROP POLICY IF EXISTS "Users can view their own project prompts" ON public.project_prompts;

CREATE POLICY "Users can create prompts for their projects" ON public.project_prompts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prompts" ON public.project_prompts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own prompts" ON public.project_prompts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own project prompts" ON public.project_prompts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ project_context ============
DROP POLICY IF EXISTS "Users can create project context" ON public.project_context;
DROP POLICY IF EXISTS "Users can delete their project context" ON public.project_context;
DROP POLICY IF EXISTS "Users can update their project context" ON public.project_context;
DROP POLICY IF EXISTS "Users can view their project context" ON public.project_context;

CREATE POLICY "Users can create project context" ON public.project_context FOR INSERT TO authenticated WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their project context" ON public.project_context FOR DELETE TO authenticated USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their project context" ON public.project_context FOR UPDATE TO authenticated USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can view their project context" ON public.project_context FOR SELECT TO authenticated USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ============ file_versions ============
DROP POLICY IF EXISTS "Users can create versions for their project files" ON public.file_versions;
DROP POLICY IF EXISTS "Users can delete versions of their project files" ON public.file_versions;
DROP POLICY IF EXISTS "Users can view versions of their project files" ON public.file_versions;

CREATE POLICY "Users can create versions for their project files" ON public.file_versions FOR INSERT TO authenticated WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete versions of their project files" ON public.file_versions FOR DELETE TO authenticated USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can view versions of their project files" ON public.file_versions FOR SELECT TO authenticated USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ============ github_connections ============
DROP POLICY IF EXISTS "Users can create their own github connection" ON public.github_connections;
DROP POLICY IF EXISTS "Users can delete their own github connection" ON public.github_connections;
DROP POLICY IF EXISTS "Users can update their own github connection" ON public.github_connections;
DROP POLICY IF EXISTS "Users can view their own github connection" ON public.github_connections;

CREATE POLICY "Users can create their own github connection" ON public.github_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own github connection" ON public.github_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own github connection" ON public.github_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own github connection" ON public.github_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ notifications ============
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ code_snippets ============
DROP POLICY IF EXISTS "Users can create their own snippets" ON public.code_snippets;
DROP POLICY IF EXISTS "Users can delete their own snippets" ON public.code_snippets;
DROP POLICY IF EXISTS "Users can update their own snippets" ON public.code_snippets;
DROP POLICY IF EXISTS "Users can view their own snippets" ON public.code_snippets;

CREATE POLICY "Users can create their own snippets" ON public.code_snippets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own snippets" ON public.code_snippets FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own snippets" ON public.code_snippets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own snippets" ON public.code_snippets FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_public = true);

-- ============ team_activity ============
DROP POLICY IF EXISTS "Users can create their own activity" ON public.team_activity;
DROP POLICY IF EXISTS "Users can view their own activity" ON public.team_activity;

CREATE POLICY "Users can create their own activity" ON public.team_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own activity" ON public.team_activity FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ project_templates ============
DROP POLICY IF EXISTS "Templates are publicly readable" ON public.project_templates;

CREATE POLICY "Templates are publicly readable" ON public.project_templates FOR SELECT TO anon, authenticated USING (true);

-- ============ user_roles ============
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
