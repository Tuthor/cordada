-- Drop the current permissive INSERT policy that allows any authenticated user
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.enrollments;

-- Create new policy that only allows service_role to insert
-- This ensures enrollments can ONLY be created through the edge function
CREATE POLICY "Only service role can insert enrollments"
ON public.enrollments
FOR INSERT
TO service_role
WITH CHECK (true);