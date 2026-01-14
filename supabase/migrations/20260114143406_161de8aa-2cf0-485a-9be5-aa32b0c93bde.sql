-- Create function to handle new consultant profile creation
CREATE OR REPLACE FUNCTION public.handle_new_consultant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create consultant profile if role is consultant
  IF NEW.role = 'consultant' THEN
    INSERT INTO public.consultant_profiles (user_id, is_available)
    VALUES (NEW.user_id, true)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create consultant profile when consultant role is assigned
DROP TRIGGER IF EXISTS on_consultant_role_created ON public.user_roles;
CREATE TRIGGER on_consultant_role_created
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_consultant();

-- Add unique constraint on user_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'consultant_profiles_user_id_key'
  ) THEN
    ALTER TABLE public.consultant_profiles ADD CONSTRAINT consultant_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Insert missing consultant profile for existing consultant
INSERT INTO public.consultant_profiles (user_id, is_available, headline, expertise)
SELECT ur.user_id, true, 'Consultor Profesional', ARRAY['Consultoría General']
FROM public.user_roles ur
LEFT JOIN public.consultant_profiles cp ON cp.user_id = ur.user_id
WHERE ur.role = 'consultant' AND cp.id IS NULL;