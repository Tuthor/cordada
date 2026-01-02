-- Add UPDATE policy for enrollments table (restricted to admins only)
CREATE POLICY "Admins can update enrollments"
ON public.enrollments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));