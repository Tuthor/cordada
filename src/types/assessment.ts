export interface Question {
  id: string;
  text: string;
  category: Category;
  blockCode: 'A' | 'B' | 'C' | 'D';
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  blockCode: 'A' | 'B' | 'C' | 'D';
}

export interface Answer {
  questionId: string;
  value: number;
}

export interface CategoryScore {
  categoryId: string;
  categoryName: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface AssessmentResult {
  totalScore: number;
  maxTotalScore: number;
  overallPercentage: number;
  categoryScores: CategoryScore[];
  maturityLevel: MaturityLevel;
  dominantLevel: MaturityLevelInfo;
  secondaryLevel?: MaturityLevelInfo;
  isInTransition: boolean;
}

export type MaturityLevel = 'campamento_base' | 'tramo_ascenso' | 'alta_montana' | 'guia';

export interface MaturityLevelInfo {
  level: MaturityLevel;
  name: string;
  blockCode: 'A' | 'B' | 'C' | 'D';
  description: string;
  characteristic: string;
  phrase: string;
  strengths: string[];
  weaknesses: string[];
  mainRisk: string;
  enabledRoles: string;
  supportNeeded: string;
  keyTools: string;
  minPercentage: number;
  maxPercentage: number;
  recommendation: string;
}
