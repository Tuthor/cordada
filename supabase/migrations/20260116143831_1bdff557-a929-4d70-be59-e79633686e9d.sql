-- Drop the existing restrictive update policy for consultants
DROP POLICY IF EXISTS "Consultants can update their own pending evidence" ON public.consultant_requirement_evidence;

-- Create a new policy that allows consultants to update their own evidence 
-- when status is pending, rejected, or when they're submitting (changing to submitted)
CREATE POLICY "Consultants can update their own evidence" 
ON public.consultant_requirement_evidence 
FOR UPDATE 
USING (auth.uid() = consultant_id);