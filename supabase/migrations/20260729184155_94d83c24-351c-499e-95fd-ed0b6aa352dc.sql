-- 1. consultant_profiles: restrict to authenticated
DROP POLICY IF EXISTS "Consultant profiles are viewable by everyone" ON public.consultant_profiles;
CREATE POLICY "Authenticated users can view consultant profiles"
  ON public.consultant_profiles FOR SELECT TO authenticated USING (true);

-- 2. consulting_firms: restrict to authenticated
DROP POLICY IF EXISTS "Firms are viewable by everyone" ON public.consulting_firms;
CREATE POLICY "Authenticated users can view firms"
  ON public.consulting_firms FOR SELECT TO authenticated USING (true);

-- 3. firm_members: only owner, self or admin
DROP POLICY IF EXISTS "Members are viewable by everyone" ON public.firm_members;
CREATE POLICY "Firm related parties can view members"
  ON public.firm_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.consulting_firms cf
      WHERE cf.id = firm_members.firm_id AND cf.owner_id = auth.uid()
    )
  );

-- 4. consultant_applications: remove broad client-facing policy, expose safe subset via function
DROP POLICY IF EXISTS "Clients can view consultants assigned to their cordadas" ON public.consultant_applications;

CREATE OR REPLACE FUNCTION public.get_client_cordada_consultants(_cordada_id uuid DEFAULT NULL)
RETURNS TABLE(cordada_id uuid, member_id uuid, consultant_id uuid, user_id uuid, full_name text, company text, linkedin text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.cordada_id, cm.id, ca.id, ca.user_id, ca.full_name, ca.company, ca.linkedin
  FROM public.cordada_members cm
  JOIN public.cordadas c ON c.id = cm.cordada_id
  JOIN public.consultant_applications ca ON ca.id = cm.consultant_id
  WHERE (_cordada_id IS NULL OR cm.cordada_id = _cordada_id)
    AND (c.client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
$$;

-- 5. Lock down SECURITY DEFINER function execution
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_cordada_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_cordada_counterparty(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consultant_matches_cordada(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.owns_consultant_application(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_safe_profile_data(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_consultant() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_cordada_member(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_cordada_counterparty(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.consultant_matches_cordada(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.owns_consultant_application(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_safe_profile_data(uuid) TO service_role;

-- App-facing RPCs remain callable
REVOKE ALL ON FUNCTION public.get_public_platform_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_stats() TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_my_consultant_application() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_consultant_application() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_cordada_interest_profiles(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cordada_interest_profiles(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.approve_cordada_interest(uuid, cordada_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_cordada_interest(uuid, cordada_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_client_cordada_consultants(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_client_cordada_consultants(uuid) TO authenticated, service_role;

-- 6. Storage: exact path ownership check for client evidence access
DROP POLICY IF EXISTS "Clients can view evidence for their own requirements" ON storage.objects;
CREATE POLICY "Clients can view evidence for their own requirements"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'requirement-evidence'
    AND EXISTS (
      SELECT 1
      FROM public.consultant_requirement_evidence cre
      JOIN public.client_requirements cr ON cr.id = cre.requirement_id
      WHERE cr.client_id = auth.uid()
        AND cre.consultant_id::text = (storage.foldername(objects.name))[1]
        AND cre.evidence_file_url IS NOT NULL
        AND right(cre.evidence_file_url, length(objects.name) + 1) = '/' || objects.name
    )
  );