-- Create table for discarded projects by consultants
CREATE TABLE public.discarded_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  discarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS
ALTER TABLE public.discarded_projects ENABLE ROW LEVEL SECURITY;

-- Users can view their own discarded projects
CREATE POLICY "Users can view their discarded projects" 
ON public.discarded_projects 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can discard projects
CREATE POLICY "Users can discard projects" 
ON public.discarded_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can restore discarded projects
CREATE POLICY "Users can restore discarded projects" 
ON public.discarded_projects 
FOR DELETE 
USING (auth.uid() = user_id);