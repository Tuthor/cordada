
-- 0. Drop dependent legacy policies
DROP POLICY IF EXISTS "Project owners can view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Proposal status can be updated by project owner" ON public.proposals;
DROP POLICY IF EXISTS "Consultants express interest in matching open cordadas" ON public.proposals;
DROP POLICY IF EXISTS "Project owners can view proposal attachments" ON storage.objects;

-- 1. Purge legacy proposals
DELETE FROM public.proposals WHERE project_id IS NOT NULL;

-- 2. Detach proposals from projects
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_project_xor_cordada;
ALTER TABLE public.proposals DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.proposals DROP COLUMN IF EXISTS is_legacy;
ALTER TABLE public.proposals ALTER COLUMN cordada_id SET NOT NULL;

-- 2b. Recreate consultant self-view + interest policies without legacy refs
CREATE POLICY "Consultants view own proposals"
  ON public.proposals FOR SELECT
  USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants express interest in matching open cordadas"
  ON public.proposals FOR INSERT
  WITH CHECK (
    cordada_id IS NOT NULL
    AND consultant_id = auth.uid()
    AND status = 'submitted'
    AND consultant_matches_cordada(auth.uid(), cordada_id)
    AND EXISTS (
      SELECT 1 FROM public.cordadas c
      WHERE c.id = proposals.cordada_id
        AND c.visibility_mode = 'open_filtered'::cordada_visibility_mode
        AND c.status = 'convocatoria'::cordada_status
    )
  );

-- 3. Drop realtime + legacy tables
ALTER PUBLICATION supabase_realtime DROP TABLE public.project_messages;
DROP TABLE public.project_messages;
DROP TABLE public.discarded_projects;
DROP TABLE public.projects;

-- 4. Harden is_cordada_counterparty
REVOKE EXECUTE ON FUNCTION public.is_cordada_counterparty(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_cordada_counterparty(uuid, uuid, uuid) TO authenticated, service_role;
