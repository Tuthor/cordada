-- Allow clients to view basic consultant info for members assigned to their cordadas
CREATE POLICY "Clients can view consultants assigned to their cordadas"
ON public.consultant_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cordada_members cm
    JOIN cordadas c ON c.id = cm.cordada_id
    WHERE cm.consultant_id = consultant_applications.id
    AND c.client_id = auth.uid()
  )
);