-- Create enrollments table to store form submissions
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  linkedin TEXT,
  expertise TEXT,
  years_experience TEXT,
  motivation TEXT,
  maturity_level TEXT,
  overall_score INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (form submissions from anonymous users)
CREATE POLICY "Allow public inserts" 
ON public.enrollments 
FOR INSERT 
WITH CHECK (true);

-- Only allow service role to read enrollments (admin access)
CREATE POLICY "Service role can read all" 
ON public.enrollments 
FOR SELECT 
USING (auth.role() = 'service_role');