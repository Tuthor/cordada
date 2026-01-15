-- Drop the overly restrictive policy for consultants
DROP POLICY IF EXISTS "Consultants can view all requirements" ON public.client_requirements;

-- Create a new policy that allows all authenticated users to view requirements
-- This makes sense because any authenticated user might want to become a consultant
CREATE POLICY "Authenticated users can view all requirements"
ON public.client_requirements
FOR SELECT
TO authenticated
USING (true);