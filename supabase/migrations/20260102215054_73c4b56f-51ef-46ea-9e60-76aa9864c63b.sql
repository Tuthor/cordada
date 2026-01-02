-- Drop the existing public insert policy
DROP POLICY IF EXISTS "Allow public inserts" ON public.enrollments;

-- Create a new policy that only allows authenticated users to insert
CREATE POLICY "Allow authenticated inserts"
ON public.enrollments
FOR INSERT
TO authenticated
WITH CHECK (true);