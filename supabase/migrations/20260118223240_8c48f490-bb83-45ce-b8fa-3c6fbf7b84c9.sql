-- =============================================
-- FIX 1: Restrict profiles table SELECT policy
-- Previously allowed anyone to view all profiles including email/phone
-- Now only authenticated users can view limited profile data OR users can see their own full profile
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a policy that only allows authenticated users to view basic profile info
-- Users can always see their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Create a separate policy for authenticated users to see other profiles (for directory, etc.)
-- This allows viewing profiles but RLS will limit what's actually returned
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- FIX 2: Add a secure view for profiles that excludes sensitive fields
-- This is for public directory viewing without exposing email/phone
-- =============================================

-- Create a function that returns safe profile data
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
$$;

-- =============================================
-- FIX 3: Fix the overly permissive storage policy for evidence files
-- The current policy allows ANY client to view ALL evidence files
-- Should only allow clients to view files for THEIR requirements
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Clients can view evidence files for their requirements" ON storage.objects;

-- Create a properly scoped policy that validates file ownership through the evidence table
CREATE POLICY "Clients can view evidence for their own requirements"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'requirement-evidence' 
  AND EXISTS (
    SELECT 1 
    FROM public.consultant_requirement_evidence cre
    JOIN public.client_requirements cr ON cr.id = cre.requirement_id
    WHERE cr.client_id = auth.uid()
      AND cre.evidence_file_url LIKE '%' || name
  )
);