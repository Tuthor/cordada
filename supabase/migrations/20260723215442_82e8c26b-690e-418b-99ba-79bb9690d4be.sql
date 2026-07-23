
-- Fase D: Manifestación de interés en cordadas abiertas

-- 1. Extender proposals
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS cordada_id uuid REFERENCES public.cordadas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_legacy boolean NOT NULL DEFAULT false;

ALTER TABLE public.proposals ALTER COLUMN project_id DROP NOT NULL;

UPDATE public.proposals SET is_legacy = true WHERE project_id IS NOT NULL AND is_legacy = false;

ALTER TABLE public.proposals
  ADD CONSTRAINT proposals_project_xor_cordada
  CHECK (
    (project_id IS NOT NULL AND cordada_id IS NULL)
    OR (project_id IS NULL AND cordada_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_proposals_cordada_consultant
  ON public.proposals (cordada_id, consultant_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_proposals_cordada_consultant
  ON public.proposals (cordada_id, consultant_id) WHERE cordada_id IS NOT NULL;

-- 2. RLS policies (add, don't drop legacy)
CREATE POLICY "Consultants express interest in matching open cordadas"
ON public.proposals FOR INSERT TO authenticated
WITH CHECK (
  cordada_id IS NOT NULL
  AND project_id IS NULL
  AND is_legacy = false
  AND consultant_id = auth.uid()
  AND status = 'submitted'
  AND public.consultant_matches_cordada(auth.uid(), cordada_id)
  AND EXISTS (
    SELECT 1 FROM public.cordadas c
    WHERE c.id = cordada_id
      AND c.visibility_mode = 'open_filtered'
      AND c.status = 'convocatoria'
  )
);

CREATE POLICY "Clients view interest on their cordadas"
ON public.proposals FOR SELECT TO authenticated
USING (
  cordada_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.cordadas c
    WHERE c.id = proposals.cordada_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Clients update interest status on their cordadas"
ON public.proposals FOR UPDATE TO authenticated
USING (
  cordada_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.cordadas c
    WHERE c.id = proposals.cordada_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Consultants update own cordada interest while submitted"
ON public.proposals FOR UPDATE TO authenticated
USING (
  cordada_id IS NOT NULL
  AND consultant_id = auth.uid()
  AND status = 'submitted'
);

CREATE POLICY "Consultants delete own cordada interest while submitted"
ON public.proposals FOR DELETE TO authenticated
USING (
  cordada_id IS NOT NULL
  AND consultant_id = auth.uid()
  AND status = 'submitted'
);

CREATE POLICY "Admins manage all proposals"
ON public.proposals FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Approval RPC (identity translation)
CREATE OR REPLACE FUNCTION public.approve_cordada_interest(
  _proposal_id uuid,
  _role cordada_role
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cordada_id uuid;
  v_user_id uuid;
  v_application_id uuid;
  v_member_id uuid;
BEGIN
  SELECT cordada_id, consultant_id INTO v_cordada_id, v_user_id
  FROM public.proposals WHERE id = _proposal_id AND cordada_id IS NOT NULL;
  IF v_cordada_id IS NULL THEN RAISE EXCEPTION 'Propuesta no válida'; END IF;

  IF NOT (
    EXISTS (SELECT 1 FROM public.cordadas WHERE id = v_cordada_id AND created_by = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT id INTO v_application_id
  FROM public.consultant_applications
  WHERE user_id = v_user_id AND status = 'aceptado'
  LIMIT 1;
  IF v_application_id IS NULL THEN
    RAISE EXCEPTION 'El consultor no tiene aplicación aceptada';
  END IF;

  INSERT INTO public.cordada_members (cordada_id, consultant_id, role, is_confirmed)
  VALUES (v_cordada_id, v_application_id, _role, false)
  RETURNING id INTO v_member_id;

  UPDATE public.proposals SET status = 'accepted', updated_at = now() WHERE id = _proposal_id;
  RETURN v_member_id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_cordada_interest(uuid, cordada_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_cordada_interest(uuid, cordada_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_cordada_interest(uuid, cordada_role) TO authenticated;
