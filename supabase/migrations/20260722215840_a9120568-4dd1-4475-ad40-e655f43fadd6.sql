
-- Fix client_companies: restrict public read to authenticated only, admins see all
DROP POLICY IF EXISTS "Client companies are viewable by everyone" ON public.client_companies;
CREATE POLICY "Owners and admins can view client companies"
  ON public.client_companies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Fix client_requirements: remove blanket authenticated read
DROP POLICY IF EXISTS "Authenticated users can view all requirements" ON public.client_requirements;
CREATE POLICY "Admins can view all requirements"
  ON public.client_requirements FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Consultants can view requirements"
  ON public.client_requirements FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultant'));

-- Fix profiles: remove blanket authenticated read; keep owner and admin
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix projects: restrict public read to open projects only
DROP POLICY IF EXISTS "Open projects are viewable by everyone" ON public.projects;
CREATE POLICY "Open projects are viewable by everyone"
  ON public.projects FOR SELECT
  TO anon, authenticated
  USING (status = 'open' OR auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));

-- Fix SECURITY DEFINER function exposure: revoke EXECUTE from anon/authenticated
-- on trigger and helper functions that should not be callable from the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_consultant() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_safe_profile_data(uuid) FROM PUBLIC, anon, authenticated;
-- has_role is used inside RLS policies; revoke from anon only, keep authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
