
-- firm_applications
CREATE TABLE public.firm_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  rut TEXT,
  website TEXT,
  founded_year INTEGER,
  contact_name TEXT NOT NULL,
  contact_position TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  size_consultants INTEGER,
  size_partners INTEGER,
  annual_revenue_uf TEXT,
  sectors TEXT[] DEFAULT '{}',
  practice_areas TEXT[] DEFAULT '{}',
  key_clients TEXT,
  certifications TEXT,
  maturity_answers JSONB DEFAULT '{}',
  maturity_scores JSONB DEFAULT '{}',
  maturity_overall NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  invitation_token TEXT UNIQUE,
  invitation_expires_at TIMESTAMPTZ,
  invitation_sent_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  activated_user_id UUID,
  accepted_code_of_conduct BOOLEAN DEFAULT false,
  accepted_data_consent BOOLEAN DEFAULT false,
  consent_accepted_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.firm_applications TO authenticated;
GRANT ALL ON public.firm_applications TO service_role;

ALTER TABLE public.firm_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage firm applications"
  ON public.firm_applications FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER firm_applications_updated_at
  BEFORE UPDATE ON public.firm_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- firm_application_leaders
CREATE TABLE public.firm_application_leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_application_id UUID NOT NULL REFERENCES public.firm_applications(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT,
  email TEXT NOT NULL,
  linkedin TEXT,
  leader_token TEXT NOT NULL UNIQUE,
  assessment_status TEXT NOT NULL DEFAULT 'pending',
  consultant_application_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_firm_leaders_application ON public.firm_application_leaders(firm_application_id);
CREATE INDEX idx_firm_leaders_token ON public.firm_application_leaders(leader_token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.firm_application_leaders TO authenticated;
GRANT ALL ON public.firm_application_leaders TO service_role;

ALTER TABLE public.firm_application_leaders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage firm leaders"
  ON public.firm_application_leaders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER firm_leaders_updated_at
  BEFORE UPDATE ON public.firm_application_leaders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link consultant applications to firm leader tokens
ALTER TABLE public.consultant_applications
  ADD COLUMN IF NOT EXISTS source_firm_leader_token TEXT;

-- Platform setting for firm invitation TTL
INSERT INTO public.platform_settings (key, value)
VALUES ('firm_invitation_ttl_hours', '168'::jsonb)
ON CONFLICT (key) DO NOTHING;
