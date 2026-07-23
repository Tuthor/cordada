// Types for Cordadas (Projects/Challenges)

export type CordadaStatus = 
  | 'draft'
  | 'convocatoria'
  | 'en_curso'
  | 'cumbre_alcanzada'
  | 'cerrada';

export type CordadaVisibilityMode = 'curated' | 'open_filtered';

// Backend supports 4 axes (see consultant_matches_cordada).
// Client v1 only sets expertise_tags and availability_required.
// archetypes and min_maturity_level are reserved for a future admin-only editor.
export interface CordadaOpenFilters {
  archetypes?: string[];
  min_maturity_level?: string;
  expertise_tags?: string[];
  availability_required?: boolean;
}

export const hasEffectiveClientFilter = (
  filters: CordadaOpenFilters | null | undefined
): boolean => {
  if (!filters) return false;
  const hasExpertise = Array.isArray(filters.expertise_tags) && filters.expertise_tags.length > 0;
  const requiresAvailability = filters.availability_required === true;
  return hasExpertise || requiresAvailability;
};

export type RitualType = 
  | 'brief_cordada'
  | 'chequeo_tramo'
  | 'cierre_cumbre';

export type CordadaRole = 
  | 'guia_alta_montana'
  | 'primer_de_cuerda'
  | 'asegurador'
  | 'explorador'
  | 'sherpa'
  | 'cronista';

export interface Cordada {
  id: string;
  title: string;
  description: string | null;
  client_name: string | null;
  client_company: string | null;
  terrain: string | null;
  risks: string | null;
  objectives: string[] | null;
  required_expertise: string[] | null;
  estimated_duration_weeks: number | null;
  budget_range: string | null;
  budget_currency: 'CLP' | 'UF' | 'USD' | null;
  budget_amount: number | null;
  status: CordadaStatus;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  visibility_mode: CordadaVisibilityMode;
  open_filters: CordadaOpenFilters | null;
  created_at: string;
  updated_at: string;
}

export interface CordadaMember {
  id: string;
  cordada_id: string;
  consultant_id: string;
  role: CordadaRole;
  is_confirmed: boolean;
  assigned_at: string;
  confirmed_at: string | null;
  notes: string | null;
  client_status: 'pendiente' | 'aprobado' | 'rechazado' | null;
  client_feedback: string | null;
  // Joined data
  consultant?: {
    full_name: string;
    email: string;
    archetype: string | null;
    maturity_level: string | null;
  };
}

export interface CordadaRitual {
  id: string;
  cordada_id: string;
  ritual_type: RitualType;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  is_completed: boolean;
  outcomes: string | null;
  attachments: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CordadaStatusInfo {
  id: CordadaStatus;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface CordadaRoleInfo {
  id: CordadaRole;
  name: string;
  description: string;
  icon: string;
  recommendedArchetypes: string[];
}

export interface RitualTypeInfo {
  id: RitualType;
  name: string;
  description: string;
  icon: string;
  step: number;
}
