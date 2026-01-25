-- Add client_id to cordadas table to link challenges to clients
ALTER TABLE public.cordadas ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES auth.users(id);

-- Add team submission and feedback fields
ALTER TABLE public.cordada_members 
  ADD COLUMN IF NOT EXISTS client_status text DEFAULT 'pendiente' CHECK (client_status IN ('pendiente', 'aprobado', 'rechazado')),
  ADD COLUMN IF NOT EXISTS client_feedback text;

-- Enable clients to view and manage their own cordadas
DROP POLICY IF EXISTS "Clients can view their own cordadas" ON public.cordadas;
CREATE POLICY "Clients can view their own cordadas"
ON public.cordadas
FOR SELECT
USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can create cordadas" ON public.cordadas;
CREATE POLICY "Clients can create cordadas"
ON public.cordadas
FOR INSERT
WITH CHECK (auth.uid() = client_id AND has_role(auth.uid(), 'client'::app_role));

DROP POLICY IF EXISTS "Clients can update their own cordadas" ON public.cordadas;
CREATE POLICY "Clients can update their own cordadas"
ON public.cordadas
FOR UPDATE
USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can delete their own draft cordadas" ON public.cordadas;
CREATE POLICY "Clients can delete their own draft cordadas"
ON public.cordadas
FOR DELETE
USING (auth.uid() = client_id AND status = 'draft');

-- Enable clients to view team members for their cordadas
DROP POLICY IF EXISTS "Clients can view members of their cordadas" ON public.cordada_members;
CREATE POLICY "Clients can view members of their cordadas"
ON public.cordada_members
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.cordadas 
  WHERE cordadas.id = cordada_members.cordada_id 
  AND cordadas.client_id = auth.uid()
));

-- Enable clients to provide feedback on team members
DROP POLICY IF EXISTS "Clients can update member feedback for their cordadas" ON public.cordada_members;
CREATE POLICY "Clients can update member feedback for their cordadas"
ON public.cordada_members
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.cordadas 
  WHERE cordadas.id = cordada_members.cordada_id 
  AND cordadas.client_id = auth.uid()
));