-- Fix the enrollments INSERT policy to only allow service role
-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Only service role can insert enrollments" ON public.enrollments;

-- Create a properly restricted policy that only allows service role to insert
-- This ensures all enrollments must go through the edge function with CAPTCHA and rate limiting
CREATE POLICY "Only service role can insert enrollments" 
ON public.enrollments 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Also drop the old "Allow public inserts" policy if it still exists
DROP POLICY IF EXISTS "Allow public inserts" ON public.enrollments;