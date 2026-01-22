-- Create code_snippets table for reusable code snippets
CREATE TABLE public.code_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT DEFAULT 'typescript',
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create github_connections table for storing GitHub OAuth tokens
CREATE TABLE public.github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  github_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for code_snippets
CREATE INDEX idx_snippets_user_id ON public.code_snippets(user_id);
CREATE INDEX idx_snippets_tags ON public.code_snippets USING GIN(tags);
CREATE INDEX idx_snippets_is_public ON public.code_snippets(is_public);

-- Indexes for github_connections
CREATE INDEX idx_github_connections_user_id ON public.github_connections(user_id);

-- Enable RLS
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for code_snippets
CREATE POLICY "Users can view their own snippets" 
ON public.code_snippets 
FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own snippets" 
ON public.code_snippets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snippets" 
ON public.code_snippets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snippets" 
ON public.code_snippets 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for github_connections (strict - only owner can access)
CREATE POLICY "Users can view their own github connection" 
ON public.github_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own github connection" 
ON public.github_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own github connection" 
ON public.github_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own github connection" 
ON public.github_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at on code_snippets
CREATE TRIGGER update_code_snippets_updated_at
BEFORE UPDATE ON public.code_snippets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on github_connections
CREATE TRIGGER update_github_connections_updated_at
BEFORE UPDATE ON public.github_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();