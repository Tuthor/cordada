-- Add explicit deny policies for INSERT, UPDATE, DELETE on user_roles table
-- This prevents privilege escalation even if RLS defaults change

-- Deny all user role inserts (only service role can assign roles)
CREATE POLICY "Deny user role inserts"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Deny all user role updates
CREATE POLICY "Deny user role updates"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Deny all user role deletes
CREATE POLICY "Deny user role deletes"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);

-- Allow service_role to manage user roles (for admin management tools)
CREATE POLICY "Service role can manage user roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);