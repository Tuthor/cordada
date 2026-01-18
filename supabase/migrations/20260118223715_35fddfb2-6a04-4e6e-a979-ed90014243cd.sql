-- =============================================
-- FIX 1: Add message length constraints to project_messages
-- Prevents storage abuse and ensures messages have content
-- =============================================

ALTER TABLE public.project_messages
  ADD CONSTRAINT message_length_check 
    CHECK (LENGTH(message) > 0 AND LENGTH(message) <= 10000);

-- =============================================
-- FIX 2: Fix storage policy LIKE pattern vulnerability
-- Replace unanchored LIKE with exact path matching for proposal attachments
-- =============================================

-- Drop the vulnerable policy
DROP POLICY IF EXISTS "Project owners can view proposal attachments" ON storage.objects;

-- Create a more secure policy using exact path matching
-- The attachment_url contains the full URL, we extract just the path portion
CREATE POLICY "Project owners can view proposal attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'proposal-attachments' 
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    JOIN public.projects pr ON pr.id = p.project_id
    WHERE pr.client_id = auth.uid()
    AND p.attachment_url IS NOT NULL
    AND name = SUBSTRING(p.attachment_url FROM 'proposal-attachments/(.*)$')
  )
);

-- =============================================
-- FIX 3: Fix evidence bucket policy with exact path matching
-- Replace the LIKE pattern with exact path matching
-- =============================================

-- Drop the vulnerable policy we created earlier
DROP POLICY IF EXISTS "Clients can view evidence for their own requirements" ON storage.objects;

-- Create a more secure policy using exact path matching
CREATE POLICY "Clients can view evidence for their own requirements"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'requirement-evidence' 
  AND EXISTS (
    SELECT 1 
    FROM public.consultant_requirement_evidence cre
    JOIN public.client_requirements cr ON cr.id = cre.requirement_id
    WHERE cr.client_id = auth.uid()
      AND cre.evidence_file_url IS NOT NULL
      AND name = SUBSTRING(cre.evidence_file_url FROM 'requirement-evidence/(.*)$')
  )
);