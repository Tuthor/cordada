-- 1. Ensure internal helpers/triggers are NOT callable through the API
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_cordada_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_cordada_counterparty(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.owns_consultant_application(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consultant_matches_cordada(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_safe_profile_data(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_consultant() FROM PUBLIC, anon, authenticated;

-- 2. App-facing RPCs: keep authenticated-only access and add explicit caller guards
REVOKE ALL ON FUNCTION public.get_my_consultant_application() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_client_cordada_consultants(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_cordada_interest_profiles(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_cordada_interest(uuid, cordada_role) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.get_my_consultant_application()
RETURNS TABLE(id uuid, user_id uuid, full_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT ca.id, ca.user_id, ca.full_name
  FROM public.consultant_applications ca
  WHERE auth.uid() IS NOT NULL
    AND ca.user_id = auth.uid()
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_client_cordada_consultants(_cordada_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(cordada_id uuid, member_id uuid, consultant_id uuid, user_id uuid, full_name text, company text, linkedin text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT cm.cordada_id, cm.id, ca.id, ca.user_id, ca.full_name, ca.company, ca.linkedin
  FROM public.cordada_members cm
  JOIN public.cordadas c ON c.id = cm.cordada_id
  JOIN public.consultant_applications ca ON ca.id = cm.consultant_id
  WHERE auth.uid() IS NOT NULL
    AND (_cordada_id IS NULL OR cm.cordada_id = _cordada_id)
    AND (c.client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
$function$;

CREATE OR REPLACE FUNCTION public.get_cordada_interest_profiles(_cordada_id uuid)
RETURNS TABLE(consultant_user_id uuid, full_name text, bio text, expertise text[])
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

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

REVOKE ALL ON FUNCTION public.get_my_consultant_application() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_client_cordada_consultants(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_cordada_interest_profiles(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_cordada_interest(uuid, cordada_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_consultant_application() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_cordada_consultants(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cordada_interest_profiles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_cordada_interest(uuid, cordada_role) TO authenticated;

-- 3. Public stats stays anonymous-callable but only exposes aggregate counts
REVOKE ALL ON FUNCTION public.get_public_platform_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_stats() TO anon, authenticated;