import { CordadaRole } from "@/types/cordada";
import { getCordadaRoleInfo } from "@/data/cordadaData";

export interface ConsultantForMatching {
  id: string;
  full_name: string;
  email: string;
  archetype: string | null;
  maturity_level: string | null;
  maturity_score: number | null;
}

export interface CompatibilityResult {
  score: number;
  breakdown: {
    archetypeMatch: number;
    maturityBonus: number;
    scoreBonus: number;
  };
  label: string;
  color: string;
}

// Maturity level weights
const MATURITY_WEIGHTS: Record<string, number> = {
  'Guía': 20,
  'Alta Montaña': 14,
  'Tramo de Ascenso': 8,
};

// Role-specific maturity requirements (some roles need more experienced consultants)
const ROLE_MATURITY_REQUIREMENTS: Record<CordadaRole, number> = {
  'guia_alta_montana': 3, // Requires high maturity
  'primer_de_cuerda': 2,
  'asegurador': 2,
  'explorador': 1,
  'sherpa': 1,
  'cronista': 1,
};

const MATURITY_RANK: Record<string, number> = {
  'Guía': 3,
  'Alta Montaña': 2,
  'Tramo de Ascenso': 1,
};

export function calculateCompatibility(
  consultant: ConsultantForMatching,
  role: CordadaRole
): CompatibilityResult {
  const roleInfo = getCordadaRoleInfo(role);
  let archetypeMatch = 0;
  let maturityBonus = 0;
  let scoreBonus = 0;

  // 1. Archetype matching (0-60 points)
  if (consultant.archetype) {
    const isRecommended = roleInfo.recommendedArchetypes.includes(consultant.archetype);
    const isPrimaryRecommendation = roleInfo.recommendedArchetypes[0] === consultant.archetype;
    
    if (isPrimaryRecommendation) {
      archetypeMatch = 60; // Perfect match
    } else if (isRecommended) {
      archetypeMatch = 48; // Good match
    } else {
      // Partial compatibility based on archetype flexibility
      archetypeMatch = 20; // Base compatibility for any consultant
    }
  }

  // 2. Maturity level bonus (0-25 points)
  if (consultant.maturity_level) {
    const consultantRank = MATURITY_RANK[consultant.maturity_level] || 0;
    const requiredRank = ROLE_MATURITY_REQUIREMENTS[role];
    
    if (consultantRank >= requiredRank) {
      maturityBonus = MATURITY_WEIGHTS[consultant.maturity_level] || 0;
      // Extra bonus for exceeding requirements
      if (consultantRank > requiredRank) {
        maturityBonus += 5;
      }
    } else {
      // Penalty for insufficient maturity
      maturityBonus = Math.max(0, (MATURITY_WEIGHTS[consultant.maturity_level] || 0) - 10);
    }
  }

  // 3. Maturity score bonus (0-15 points)
  if (consultant.maturity_score !== null) {
    scoreBonus = Math.round((consultant.maturity_score / 100) * 15);
  }

  const totalScore = Math.min(100, archetypeMatch + maturityBonus + scoreBonus);

  return {
    score: totalScore,
    breakdown: {
      archetypeMatch,
      maturityBonus,
      scoreBonus,
    },
    label: getCompatibilityLabel(totalScore),
    color: getCompatibilityColor(totalScore),
  };
}

function getCompatibilityLabel(score: number): string {
  if (score >= 85) return 'Excelente';
  if (score >= 70) return 'Muy bueno';
  if (score >= 55) return 'Bueno';
  if (score >= 40) return 'Aceptable';
  return 'Bajo';
}

function getCompatibilityColor(score: number): string {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 55) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

// Sort consultants by compatibility for a given role
export function rankConsultantsForRole(
  consultants: ConsultantForMatching[],
  role: CordadaRole
): Array<ConsultantForMatching & { compatibility: CompatibilityResult }> {
  return consultants
    .map(consultant => ({
      ...consultant,
      compatibility: calculateCompatibility(consultant, role),
    }))
    .sort((a, b) => b.compatibility.score - a.compatibility.score);
}
