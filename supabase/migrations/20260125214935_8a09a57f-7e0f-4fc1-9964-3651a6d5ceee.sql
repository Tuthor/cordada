-- Create storage bucket for cordada attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('cordada-attachments', 'cordada-attachments', false);

-- Add attachment columns to cordadas table
ALTER TABLE public.cordadas
ADD COLUMN terrain_attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN risks_attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN description_attachment jsonb DEFAULT NULL;

-- Create table to track sensitive documents
CREATE TABLE public.cordada_sensitive_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cordada_id UUID NOT NULL REFERENCES public.cordadas(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  marked_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on sensitive documents table
ALTER TABLE public.cordada_sensitive_documents ENABLE ROW LEVEL SECURITY;

-- Only admins can manage sensitive document markers
CREATE POLICY "Admins can manage sensitive documents"
ON public.cordada_sensitive_documents
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for cordada attachments

-- Admins can do everything
CREATE POLICY "Admins full access to cordada attachments"
ON storage.objects
FOR ALL
USING (bucket_id = 'cordada-attachments' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'cordada-attachments' AND public.has_role(auth.uid(), 'admin'));

-- Guías can view attachments for their cordadas (including sensitive)
CREATE POLICY "Guias can view cordada attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cordada-attachments' 
  AND EXISTS (
    SELECT 1 FROM public.cordada_members cm
    WHERE cm.consultant_id IN (
      SELECT ca.id FROM public.consultant_applications ca 
      WHERE ca.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    AND cm.role = 'guia_alta_montana'
    AND cm.cordada_id::text = (string_to_array(name, '/'))[1]
  )
);

-- Other team members can view non-sensitive attachments
CREATE POLICY "Team members can view non-sensitive attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cordada-attachments'
  AND EXISTS (
    SELECT 1 FROM public.cordada_members cm
    WHERE cm.consultant_id IN (
      SELECT ca.id FROM public.consultant_applications ca 
      WHERE ca.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    AND cm.cordada_id::text = (string_to_array(name, '/'))[1]
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.cordada_sensitive_documents csd
    WHERE csd.file_path = name
  )
);