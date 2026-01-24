-- Enum for the 5 consultant archetypes (profile classification)
CREATE TYPE public.consultant_archetype AS ENUM (
  'experto_silencioso',
  'ex_ejecutivo', 
  'tecnico_alto_nivel',
  'consultor_incompleto',
  'independiente_quemado'
);

-- Enum for application status in the funnel
CREATE TYPE public.application_status AS ENUM (
  'postulacion',
  'entrevista_pendiente',
  'entrevista_realizada',
  'codigo_conducta_pendiente',
  'aceptado',
  'rechazado'
);

-- Enum for risk alert types
CREATE TYPE public.risk_alert_type AS ENUM (
  'riesgo_comercial',
  'desgaste_cautela',
  'sobreconfianza'
);

-- Table for consultant applications (onboarding funnel)
CREATE TABLE public.consultant_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- From enrollment or new application
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  
  -- Basic info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  company TEXT,
  linkedin TEXT,
  
  -- Application status in funnel
  status public.application_status NOT NULL DEFAULT 'postulacion',
  
  -- Archetype classification (5 archetypes)
  archetype public.consultant_archetype,
  archetype_score JSONB, -- Scores for each archetype
  
  -- Maturity level (from existing test)
  maturity_level TEXT,
  maturity_score INTEGER,
  maturity_block_scores JSONB, -- Scores per block A/B/C/D
  
  -- Role archetype (from existing 6 roles test)
  role_archetype TEXT,
  role_archetype_secondary TEXT,
  
  -- Interview and validation
  interview_date TIMESTAMP WITH TIME ZONE,
  interview_notes TEXT,
  interviewer_id UUID REFERENCES auth.users(id),
  
  -- Code of conduct
  code_of_conduct_accepted BOOLEAN DEFAULT FALSE,
  code_of_conduct_accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin notes
  admin_notes TEXT,
  
  -- Risk alerts (calculated based on archetype and maturity)
  active_risk_alerts public.risk_alert_type[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultant_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consultant_applications
CREATE POLICY "Admins can manage all applications"
ON public.consultant_applications
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Table for tracking evolution history
CREATE TABLE public.consultant_evolution_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  consultant_id UUID NOT NULL, -- Can be application_id or user_id depending on stage
  
  -- What changed
  change_type TEXT NOT NULL, -- 'maturity_level', 'archetype', 'role', 'status', 'promotion'
  previous_value TEXT,
  new_value TEXT,
  
  -- Context
  reason TEXT,
  admin_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultant_evolution_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for evolution history
CREATE POLICY "Admins can manage evolution history"
ON public.consultant_evolution_history
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_consultant_applications_updated_at
BEFORE UPDATE ON public.consultant_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();