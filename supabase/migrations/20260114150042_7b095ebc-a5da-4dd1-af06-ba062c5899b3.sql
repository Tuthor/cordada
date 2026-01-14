-- Create client_requirements table for storing custom requirements
CREATE TABLE public.client_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on client_requirements
ALTER TABLE public.client_requirements ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_requirements
CREATE POLICY "Clients can view their own requirements"
  ON public.client_requirements
  FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Consultants can view all requirements"
  ON public.client_requirements
  FOR SELECT
  USING (has_role(auth.uid(), 'consultant'::app_role));

CREATE POLICY "Clients can create their own requirements"
  ON public.client_requirements
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own requirements"
  ON public.client_requirements
  FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete their own requirements"
  ON public.client_requirements
  FOR DELETE
  USING (auth.uid() = client_id);

-- Create consultant_requirement_evidence table
CREATE TABLE public.consultant_requirement_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES public.client_requirements(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL,
  evidence_file_url TEXT,
  evidence_file_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requirement_id, consultant_id)
);

-- Enable RLS on consultant_requirement_evidence
ALTER TABLE public.consultant_requirement_evidence ENABLE ROW LEVEL SECURITY;

-- RLS policies for consultant_requirement_evidence
CREATE POLICY "Consultants can view their own evidence"
  ON public.consultant_requirement_evidence
  FOR SELECT
  USING (auth.uid() = consultant_id);

CREATE POLICY "Clients can view evidence for their requirements"
  ON public.consultant_requirement_evidence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.client_requirements cr
      WHERE cr.id = requirement_id AND cr.client_id = auth.uid()
    )
  );

CREATE POLICY "Consultants can insert their own evidence"
  ON public.consultant_requirement_evidence
  FOR INSERT
  WITH CHECK (auth.uid() = consultant_id);

CREATE POLICY "Consultants can update their own pending evidence"
  ON public.consultant_requirement_evidence
  FOR UPDATE
  USING (auth.uid() = consultant_id AND status IN ('pending', 'rejected'));

CREATE POLICY "Clients can update evidence status for their requirements"
  ON public.consultant_requirement_evidence
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.client_requirements cr
      WHERE cr.id = requirement_id AND cr.client_id = auth.uid()
    )
  );

-- Create storage bucket for requirement evidence files
INSERT INTO storage.buckets (id, name, public) VALUES ('requirement-evidence', 'requirement-evidence', false);

-- Storage policies for requirement-evidence bucket
CREATE POLICY "Users can upload their own evidence files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'requirement-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own evidence files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'requirement-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Clients can view evidence files for their requirements"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'requirement-evidence' AND
    has_role(auth.uid(), 'client'::app_role)
  );

CREATE POLICY "Users can delete their own evidence files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'requirement-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add trigger for updated_at on both tables
CREATE TRIGGER update_client_requirements_updated_at
  BEFORE UPDATE ON public.client_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultant_requirement_evidence_updated_at
  BEFORE UPDATE ON public.consultant_requirement_evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();