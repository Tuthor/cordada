
CREATE OR REPLACE FUNCTION public.is_cordada_member(_cordada_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cordada_members cm
    JOIN public.consultant_applications ca ON ca.id = cm.consultant_id
    WHERE cm.cordada_id = _cordada_id AND ca.user_id = _user_id
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_cordada_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_cordada_member(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Consultants can view their own memberships" ON public.cordada_members;
CREATE POLICY "Consultants can view their own memberships"
ON public.cordada_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.consultant_applications ca
    WHERE ca.id = cordada_members.consultant_id
      AND ca.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Consultants can view cordadas they belong to" ON public.cordadas;
CREATE POLICY "Consultants can view cordadas they belong to"
ON public.cordadas
FOR SELECT
TO authenticated
USING (public.is_cordada_member(cordadas.id, auth.uid()));
