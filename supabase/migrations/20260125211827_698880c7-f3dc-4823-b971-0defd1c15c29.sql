-- Enum for cordada status
CREATE TYPE public.cordada_status AS ENUM (
  'draft',
  'convocatoria',
  'en_curso',
  'cumbre_alcanzada',
  'cerrada'
);

-- Enum for ritual types
CREATE TYPE public.ritual_type AS ENUM (
  'brief_cordada',
  'chequeo_tramo',
  'cierre_cumbre'
);

-- Enum for operational roles in a cordada
CREATE TYPE public.cordada_role AS ENUM (
  'guia_alta_montana',
  'primer_de_cuerda',
  'asegurador',
  'explorador',
  'sherpa',
  'cronista'
);

-- Cordadas table (RFP/Desafíos)
CREATE TABLE public.cordadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  client_company TEXT,
  terrain TEXT, -- Descripción del terreno/contexto
  risks TEXT, -- Riesgos identificados
  objectives TEXT[], -- Objetivos del desafío
  required_expertise TEXT[], -- Expertise requerida
  estimated_duration_weeks INTEGER,
  budget_range TEXT,
  status cordada_status NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cordadas ENABLE ROW LEVEL SECURITY;

-- Only admins can manage cordadas
CREATE POLICY "Admins can manage cordadas"
  ON public.cordadas
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Cordada members (team assignments)
CREATE TABLE public.cordada_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cordada_id UUID NOT NULL REFERENCES public.cordadas(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES public.consultant_applications(id) ON DELETE CASCADE,
  role cordada_role NOT NULL,
  is_confirmed BOOLEAN DEFAULT false,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(cordada_id, consultant_id)
);

-- Enable RLS
ALTER TABLE public.cordada_members ENABLE ROW LEVEL SECURITY;

-- Only admins can manage cordada members
CREATE POLICY "Admins can manage cordada members"
  ON public.cordada_members
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Cordada rituals (milestones tracking)
CREATE TABLE public.cordada_rituals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cordada_id UUID NOT NULL REFERENCES public.cordadas(id) ON DELETE CASCADE,
  ritual_type ritual_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  completed_date TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  outcomes TEXT, -- Resultados/hallazgos
  attachments TEXT[], -- URLs de documentos adjuntos
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cordada_id, ritual_type)
);

-- Enable RLS
ALTER TABLE public.cordada_rituals ENABLE ROW LEVEL SECURITY;

-- Only admins can manage rituals
CREATE POLICY "Admins can manage cordada rituals"
  ON public.cordada_rituals
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_cordadas_updated_at
  BEFORE UPDATE ON public.cordadas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cordada_rituals_updated_at
  BEFORE UPDATE ON public.cordada_rituals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();