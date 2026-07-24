
CREATE OR REPLACE FUNCTION public.get_public_platform_stats()
RETURNS TABLE(consultants_accepted integer, companies integer, cordadas_convocatoria integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::int FROM public.consultant_applications WHERE status = 'aceptado'),
    (SELECT COUNT(*)::int FROM public.client_companies),
    (SELECT COUNT(*)::int FROM public.cordadas WHERE status = 'convocatoria');
$$;

REVOKE ALL ON FUNCTION public.get_public_platform_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_stats() TO anon, authenticated, service_role;
