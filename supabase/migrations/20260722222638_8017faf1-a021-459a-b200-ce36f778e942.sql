
-- 1. Extend consultant_applications
ALTER TABLE public.consultant_applications
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invitation_token uuid,
  ADD COLUMN IF NOT EXISTS invitation_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS invitation_used_at timestamptz,
  ADD COLUMN IF NOT EXISTS data_consent_accepted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS consultant_applications_invitation_token_key
  ON public.consultant_applications(invitation_token)
  WHERE invitation_token IS NOT NULL;

-- 2. platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read platform settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert platform settings"
  ON public.platform_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete platform settings"
  ON public.platform_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.platform_settings(key, value)
  VALUES ('consultant_invitation_ttl_days', '14'::jsonb)
  ON CONFLICT (key) DO NOTHING;

-- 3. handle_new_user_role: excluir 'consultant' del signup público
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  user_role := NEW.raw_user_meta_data ->> 'role';

  -- 'consultant' role can ONLY be assigned via the activate-consultant edge function
  -- (which uses service_role and inserts directly). Public signup can no longer request it.
  IF user_role IS NOT NULL AND user_role IN ('client', 'consulting_firm', 'partner') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role::app_role);
  END IF;

  RETURN NEW;
END;
$function$;
