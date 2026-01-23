-- Allow authenticated users to see consultant roles for the directory
CREATE POLICY "Authenticated users can view consultant roles for directory"
ON public.user_roles
FOR SELECT
TO authenticated
USING (role = 'consultant');