
-- Bug 1: fix ownership checks (created_by -> client_id)
DROP POLICY IF EXISTS "Clients view interest on their cordadas" ON public.proposals;
CREATE POLICY "Clients view interest on their cordadas"
ON public.proposals FOR SELECT TO authenticated
USING (
  cordada_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.cordadas c
    WHERE c.id = proposals.cordada_id AND c.client_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clients update interest status on their cordadas" ON public.proposals;
CREATE POLICY "Clients update interest status on their cordadas"
ON public.proposals FOR UPDATE TO authenticated
USING (
  cordada_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.cordadas c
    WHERE c.id = proposals.cordada_id AND c.client_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.approve_cordada_interest(_proposal_id uuid, _role cordada_role)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    EXISTS (SELECT 1 FROM public.cordadas WHERE id = v_cordada_id AND client_id = auth.uid())
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
$function$;

-- Bug 2: scoped SECURITY DEFINER to enrich interested list
CREATE OR REPLACE FUNCTION public.get_cordada_interest_profiles(_cordada_id uuid)
 RETURNS TABLE(consultant_user_id uuid, full_name text, bio text, expertise text[])
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.cordadas WHERE id = _cordada_id AND client_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    p.consultant_id AS consultant_user_id,
    pr.full_name,
    pr.bio,
    cp.expertise
  FROM public.proposals p
  LEFT JOIN public.profiles pr ON pr.user_id = p.consultant_id
  LEFT JOIN public.consultant_profiles cp ON cp.user_id = p.consultant_id
  WHERE p.cordada_id = _cordada_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_cordada_interest_profiles(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cordada_interest_profiles(uuid) TO authenticated;
