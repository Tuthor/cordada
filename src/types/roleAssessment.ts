// Types for Role/Archetype Assessment

export type RoleArchetype = 
  | 'guia_alta_montana'
  | 'primer_de_cuerda'
  | 'asegurador'
  | 'explorador'
  | 'sherpa'
  | 'cronista';

export interface RoleCategory {
  id: RoleArchetype;
  name: string;
  icon: string;
  description: string;
}

export interface RoleQuestion {
  id: string;
  text: string;
  archetype: RoleArchetype;
}

export interface RoleAnswer {
  questionId: string;
  value: number;
}

export interface RoleArchetypeScore {
  archetypeId: RoleArchetype;
  archetypeName: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface RoleArchetypeInfo {
  archetype: RoleArchetype;
  name: string;
  icon: string;
  characteristic: string;
  phrase: string;
  description: string;
  strengths: string[];
  potentialWeaknesses: string[];
  bestContext: string;
  complementaryRoles: RoleArchetype[];
}

export interface RoleAssessmentResult {
  archetypeScores: RoleArchetypeScore[];
  dominantArchetype: RoleArchetypeInfo;
  secondaryArchetype?: RoleArchetypeInfo;
  hasTie: boolean;
}
