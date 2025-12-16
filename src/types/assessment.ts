export interface Question {
  id: string;
  text: string;
  category: Category;
  options: Option[];
}

export interface Option {
  value: number;
  label: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
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
}

export type MaturityLevel = 'emerging' | 'developing' | 'proficient' | 'advanced' | 'expert';

export interface MaturityLevelInfo {
  level: MaturityLevel;
  name: string;
  description: string;
  minPercentage: number;
  maxPercentage: number;
  recommendation: string;
}
