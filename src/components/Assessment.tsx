import { useState, useMemo } from 'react';
import { Answer, AssessmentResult, CategoryScore } from '@/types/assessment';
import { RoleAssessmentResult } from '@/types/roleAssessment';
import { questions, categories, getMaturityLevel, maturityLevels } from '@/data/assessmentData';
import WelcomeScreen from './WelcomeScreen';
import QuestionCard from './QuestionCard';
import ProgressBar from './ProgressBar';
import ResultsScreen from './ResultsScreen';
import EnrollmentForm from './EnrollmentForm';
import RoleAssessment from './RoleAssessment';

type AssessmentState = 'welcome' | 'questions' | 'results' | 'role_assessment' | 'enrollment';

interface AssessmentProps {
  firmToken?: string;
  leaderToken?: string;
}

const Assessment = ({ firmToken, leaderToken }: AssessmentProps = {}) => {
  const [state, setState] = useState<AssessmentState>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [roleResult, setRoleResult] = useState<RoleAssessmentResult | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  const handleStart = () => {
    setState('questions');
    setCurrentQuestionIndex(0);
    setAnswers(new Map());
  };

  const handleAnswer = (value: number) => {
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, value);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setState('results');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setState('welcome');
    }
  };

  const handleRestart = () => {
    setState('welcome');
    setCurrentQuestionIndex(0);
    setAnswers(new Map());
  };

  const handleContinueToRoleAssessment = () => {
    setState('role_assessment');
  };

  const handleSkipRoleAssessment = () => {
    setState('enrollment');
  };

  const handleRoleAssessmentComplete = (result: RoleAssessmentResult) => {
    setRoleResult(result);
    setState('enrollment');
  };

  const handleBackToResults = () => {
    setState('results');
  };

  const result = useMemo((): AssessmentResult | null => {
    if (state !== 'results' && state !== 'enrollment') return null;

    // Calcular puntuación por bloque
    const categoryScores: CategoryScore[] = categories.map((category) => {
      const categoryQuestions = questions.filter((q) => q.category.id === category.id);
      const totalScore = categoryQuestions.reduce((sum, q) => {
        return sum + (answers.get(q.id) || 0);
      }, 0);
      const maxScore = categoryQuestions.length * 5; // Escala 1-5

      return {
        categoryId: category.id,
        categoryName: category.name,
        score: totalScore,
        maxScore,
        percentage: (totalScore / maxScore) * 100,
      };
    });

    // Encontrar el bloque dominante (mayor porcentaje)
    const sortedScores = [...categoryScores].sort((a, b) => b.percentage - a.percentage);
    const dominantCategory = sortedScores[0];
    const secondaryCategory = sortedScores[1];

    // Determinar si está en transición (diferencia de ±3 puntos = ±12% en escala de 25 puntos max)
    const isInTransition = Math.abs(dominantCategory.percentage - secondaryCategory.percentage) <= 12;

    // Obtener nivel de madurez basado en el bloque dominante
    const dominantBlockCode = categories.find(c => c.id === dominantCategory.categoryId)?.blockCode || 'A';
    const secondaryBlockCode = categories.find(c => c.id === secondaryCategory.categoryId)?.blockCode || 'A';
    
    const dominantLevel = maturityLevels.find(l => l.blockCode === dominantBlockCode) || maturityLevels[0];
    const secondaryLevel = maturityLevels.find(l => l.blockCode === secondaryBlockCode);

    const totalScore = categoryScores.reduce((sum, cs) => sum + cs.score, 0);
    const maxTotalScore = categoryScores.reduce((sum, cs) => sum + cs.maxScore, 0);
    const overallPercentage = (totalScore / maxTotalScore) * 100;

    return {
      totalScore,
      maxTotalScore,
      overallPercentage,
      categoryScores,
      maturityLevel: dominantLevel.level,
      dominantLevel,
      secondaryLevel,
      isInTransition,
    };
  }, [state, answers]);

  if (state === 'welcome') {
    return <WelcomeScreen onStart={handleStart} />;
  }

  if (state === 'role_assessment') {
    return (
      <RoleAssessment
        onComplete={handleRoleAssessmentComplete}
        onSkip={handleSkipRoleAssessment}
      />
    );
  }

  if (state === 'enrollment' && result) {
    return (
      <EnrollmentForm 
        result={result} 
        levelInfo={result.dominantLevel} 
        roleResult={roleResult}
        onBack={handleBackToResults}
        firmToken={firmToken}
        leaderToken={leaderToken}
      />
    );
  }

  if (state === 'results' && result) {
    return (
      <ResultsScreen 
        result={result} 
        levelInfo={result.dominantLevel} 
        onRestart={handleRestart} 
        onContinue={handleContinueToRoleAssessment} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Test de Madurez del Consultor</h1>
          <p className="text-muted-foreground mb-4">La Cordada</p>
          <ProgressBar
            current={currentQuestionIndex + 1}
            total={questions.length}
            categoryName={currentQuestion.category.name}
          />
        </div>

        {/* Pregunta */}
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          selectedValue={answers.get(currentQuestion.id)}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isFirst={false}
          isLast={currentQuestionIndex === questions.length - 1}
        />
      </div>
    </div>
  );
};

export default Assessment;
