-- Add new columns to proposals table for detailed applications
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS scope text,
ADD COLUMN IF NOT EXISTS deliverables text,
ADD COLUMN IF NOT EXISTS timeline text,
ADD COLUMN IF NOT EXISTS attachment_url text;

-- Update status constraint to include new statuses
-- First drop if exists, then add the constraint
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_status_check;

-- Add check constraint for proposal statuses
ALTER TABLE public.proposals 
ADD CONSTRAINT proposals_status_check 
CHECK (status IN ('draft', 'submitted', 'shortlisted', 'accepted', 'rejected'));

-- Update existing 'pending' status to 'submitted'
UPDATE public.proposals SET status = 'submitted' WHERE status = 'pending';

-- Add draft status to projects
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'closed', 'cancelled'));

-- Create storage bucket for proposal attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-attachments', 'proposal-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for proposal attachments bucket
CREATE POLICY "Consultants can upload their attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'proposal-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Consultants can view their own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'proposal-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Project owners can view proposal attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'proposal-attachments' 
  AND EXISTS (
    SELECT 1 FROM proposals p
    JOIN projects pr ON pr.id = p.project_id
    WHERE pr.client_id = auth.uid()
    AND p.attachment_url LIKE '%' || name
  )
);

CREATE POLICY "Consultants can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'proposal-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);