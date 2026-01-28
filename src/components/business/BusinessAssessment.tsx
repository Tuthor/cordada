import { useState } from 'react';
import { BusinessAnswer, RespondentProfile } from '@/types/businessDiagnostic';
import { businessQuestions, businessSections, scaleAnswerOptions } from '@/data/businessDiagnosticData';
import BusinessWelcomeScreen from './BusinessWelcomeScreen';
import BusinessQuestionCard from './BusinessQuestionCard';
import BusinessResultsScreen from './BusinessResultsScreen';
import { Progress } from '@/components/ui/progress';

type AssessmentState = 'welcome' | 'questions' | 'results';

const BusinessAssessment = () => {
  const [state, setState] = useState<AssessmentState>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | number>>(new Map());

  const currentQuestion = businessQuestions[currentQuestionIndex];
  const currentSection = currentQuestion?.section;

  // Calculate progress within sections
  const profileQuestions = businessQuestions.filter(q => q.section.id === 'respondent_profile');
  const diagnosticQuestions = businessQuestions.filter(q => q.section.id !== 'respondent_profile');
  
  const isProfileSection = currentQuestion?.section.id === 'respondent_profile';
  const profileProgress = isProfileSection 
    ? ((currentQuestionIndex + 1) / profileQuestions.length) * 100
    : 100;
  
  const diagnosticProgress = !isProfileSection
    ? ((currentQuestionIndex - profileQuestions.length + 1) / diagnosticQuestions.length) * 100
    : 0;

  const handleStart = () => {
    setState('questions');
    setCurrentQuestionIndex(0);
    setAnswers(new Map());
  };

  const handleAnswer = (value: string | number) => {
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, value);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < businessQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setState('results');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRestart = () => {
    setState('welcome');
    setCurrentQuestionIndex(0);
    setAnswers(new Map());
  };

  // Extract respondent profile from answers
  const getRespondentProfile = (): RespondentProfile => {
    return {
      company: (answers.get('profile_company') as string) || '',
      industry: (answers.get('profile_industry') as string) || '',
      companySize: (answers.get('profile_size') as string) || '',
      functionalArea: (answers.get('profile_area') as string) || '',
      position: (answers.get('profile_position') as string) || '',
      positionPurpose: (answers.get('profile_purpose') as string) || '',
      yearsInCompany: (answers.get('profile_years') as string) || '',
      decisionLevel: (answers.get('profile_decision_level') as string) || '',
    };
  };

  // Calculate section scores
  const calculateSectionScores = () => {
    const scorableSections = businessSections.filter(s => s.id !== 'respondent_profile');
    
    return scorableSections.map(section => {
      const sectionQuestions = businessQuestions.filter(
        q => q.section.id === section.id && q.type === 'scale'
      );
      
      const totalScore = sectionQuestions.reduce((sum, q) => {
        return sum + ((answers.get(q.id) as number) || 0);
      }, 0);
      
      const maxScore = sectionQuestions.length * 5;
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      
      let interpretation = '';
      if (percentage < 40) {
        interpretation = 'Área crítica que requiere atención prioritaria';
      } else if (percentage < 70) {
        interpretation = 'Área con oportunidades de mejora significativas';
      } else {
        interpretation = 'Área con buen desempeño, mantener y refinar';
      }
      
      return {
        sectionId: section.id,
        sectionName: section.name,
        score: totalScore,
        maxScore,
        percentage,
        interpretation,
      };
    });
  };

  if (state === 'welcome') {
    return <BusinessWelcomeScreen onStart={handleStart} />;
  }

  if (state === 'results') {
    const sectionScores = calculateSectionScores();
    const overallScore = sectionScores.reduce((sum, s) => sum + s.percentage, 0) / sectionScores.length;
    
    return (
      <BusinessResultsScreen
        respondentProfile={getRespondentProfile()}
        sectionScores={sectionScores}
        overallScore={overallScore}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Diagnóstico Empresarial
          </h1>
          <p className="text-muted-foreground mb-4">CORDADA</p>
          
          {/* Progress indicators */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">
                  {isProfileSection ? 'Perfil del Respondente' : currentSection?.name}
                </span>
                <span className="text-foreground font-medium">
                  {currentQuestionIndex + 1} de {businessQuestions.length}
                </span>
              </div>
              <Progress 
                value={((currentQuestionIndex + 1) / businessQuestions.length) * 100} 
                className="h-2"
              />
            </div>
            
            {isProfileSection && (
              <p className="text-xs text-muted-foreground">
                Primero necesitamos conocer su contexto para personalizar el diagnóstico
              </p>
            )}
          </div>
        </div>

        {/* Question */}
        <BusinessQuestionCard
          question={currentQuestion}
          selectedValue={answers.get(currentQuestion.id)}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isFirst={currentQuestionIndex === 0}
          isLast={currentQuestionIndex === businessQuestions.length - 1}
          scaleOptions={scaleAnswerOptions}
        />
      </div>
    </div>
  );
};

export default BusinessAssessment;
