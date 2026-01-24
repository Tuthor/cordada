// Types for Orchestration Panel

export type ConsultantArchetype = 
  | 'experto_silencioso'
  | 'ex_ejecutivo'
  | 'tecnico_alto_nivel'
  | 'consultor_incompleto'
  | 'independiente_quemado';

export type ApplicationStatus = 
  | 'postulacion'
  | 'entrevista_pendiente'
  | 'entrevista_realizada'
  | 'codigo_conducta_pendiente'
  | 'aceptado'
  | 'rechazado';

export type RiskAlertType = 
  | 'riesgo_comercial'
  | 'desgaste_cautela'
  | 'sobreconfianza';

export interface ConsultantArchetypeInfo {
  id: ConsultantArchetype;
  name: string;
  icon: string;
  description: string;
  characteristics: string[];
  riskFactors: RiskAlertType[];
  recommendedSupport: string;
}

export interface ApplicationStatusInfo {
  id: ApplicationStatus;
  name: string;
  description: string;
  step: number;
}

export interface RiskAlertInfo {
  id: RiskAlertType;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  icon: string;
}

export interface ConsultantApplication {
  id: string;
  enrollment_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  linkedin: string | null;
  status: ApplicationStatus;
  archetype: ConsultantArchetype | null;
  archetype_score: Record<ConsultantArchetype, number> | null;
  maturity_level: string | null;
  maturity_score: number | null;
  maturity_block_scores: Record<string, number> | null;
  role_archetype: string | null;
  role_archetype_secondary: string | null;
  interview_date: string | null;
  interview_notes: string | null;
  interviewer_id: string | null;
  code_of_conduct_accepted: boolean;
  code_of_conduct_accepted_at: string | null;
  admin_notes: string | null;
  active_risk_alerts: RiskAlertType[] | null;
  created_at: string;
  updated_at: string;
}

export interface EvolutionHistoryEntry {
  id: string;
  consultant_id: string;
  change_type: string;
  previous_value: string | null;
  new_value: string | null;
  reason: string | null;
  admin_id: string | null;
  created_at: string;
}
