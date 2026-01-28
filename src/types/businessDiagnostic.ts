export interface BusinessQuestion {
  id: string;
  text: string;
  section: BusinessSection;
  type: 'scale' | 'single_choice' | 'text';
  options?: { value: string; label: string }[];
}

export interface BusinessSection {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface BusinessAnswer {
  questionId: string;
  value: string | number;
}

export interface RespondentProfile {
  company: string;
  industry: string;
  companySize: string;
  functionalArea: string;
  position: string;
  positionPurpose: string;
  yearsInCompany: string;
  decisionLevel: string;
}

export interface BusinessDiagnosticResult {
  respondentProfile: RespondentProfile;
  sectionScores: BusinessSectionScore[];
  overallScore: number;
  diagnosticAreas: DiagnosticArea[];
  priorityRecommendations: string[];
}

export interface BusinessSectionScore {
  sectionId: string;
  sectionName: string;
  score: number;
  maxScore: number;
  percentage: number;
  interpretation: string;
}

export interface DiagnosticArea {
  id: string;
  name: string;
  status: 'critical' | 'warning' | 'healthy';
  description: string;
  indicators: string[];
  recommendations: string[];
}
