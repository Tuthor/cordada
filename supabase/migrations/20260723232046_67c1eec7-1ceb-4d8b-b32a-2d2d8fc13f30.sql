
CREATE OR REPLACE FUNCTION public.get_my_consultant_application()
RETURNS TABLE (id uuid, user_id uuid, full_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ca.id, ca.user_id, ca.full_name
  FROM public.consultant_applications ca
  WHERE ca.user_id = auth.uid()
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_consultant_application() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_consultant_application() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.owns_consultant_application(_application_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consultant_applications
    WHERE id = _application_id AND user_id = _user_id
  );
$$;
REVOKE EXECUTE ON FUNCTION public.owns_consultant_application(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_consultant_application(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Consultants can view their own memberships" ON public.cordada_members;
CREATE POLICY "Consultants can view their own memberships"
ON public.cordada_members FOR SELECT TO authenticated
USING (public.owns_consultant_application(cordada_members.consultant_id, auth.uid()));
