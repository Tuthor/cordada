import { useState, useMemo } from 'react';
import { RoleArchetypeScore, RoleAssessmentResult, RoleArchetype } from '@/types/roleAssessment';
import { roleQuestions, roleCategories, getRoleArchetypeInfo, roleAnswerOptions } from '@/data/roleAssessmentData';
import RoleQuestionCard from './RoleQuestionCard';
import RoleResultsScreen from './RoleResultsScreen';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Compass } from 'lucide-react';

type RoleAssessmentState = 'intro' | 'questions' | 'results';

interface RoleAssessmentProps {
  onComplete?: (result: RoleAssessmentResult) => void;
  onSkip?: () => void;
}

const RoleAssessment = ({ onComplete, onSkip }: RoleAssessmentProps) => {
  const [state, setState] = useState<RoleAssessmentState>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());

  const currentQuestion = roleQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / roleQuestions.length) * 100;

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
    if (currentQuestionIndex < roleQuestions.length - 1) {
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
    setState('intro');
    setCurrentQuestionIndex(0);
    setAnswers(new Map());
  };

  const result = useMemo((): RoleAssessmentResult | null => {
    if (state !== 'results') return null;

    // Calcular puntuación por arquetipo
    const archetypeScores: RoleArchetypeScore[] = roleCategories.map((category) => {
      const archetypeQuestions = roleQuestions.filter((q) => q.archetype === category.id);
      const totalScore = archetypeQuestions.reduce((sum, q) => {
        return sum + (answers.get(q.id) || 0);
      }, 0);
      const maxScore = archetypeQuestions.length * 5; // Escala 1-5

      return {
        archetypeId: category.id,
        archetypeName: category.name,
        score: totalScore,
        maxScore,
        percentage: (totalScore / maxScore) * 100,
      };
    });

    // Ordenar por puntuación
    const sortedScores = [...archetypeScores].sort((a, b) => b.score - a.score);
    const dominantScore = sortedScores[0];
    const secondaryScore = sortedScores[1];

    // Detectar empate
    const hasTie = dominantScore.score === secondaryScore.score;

    const dominantArchetype = getRoleArchetypeInfo(dominantScore.archetypeId);
    const secondaryArchetype = getRoleArchetypeInfo(secondaryScore.archetypeId);

    return {
      archetypeScores,
      dominantArchetype,
      secondaryArchetype,
      hasTie,
    };
  }, [state, answers]);

  // Pantalla de introducción
  if (state === 'intro') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-8 lg:py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-card rounded-2xl shadow-lg p-8 lg:p-12 text-center border border-border">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Compass className="w-10 h-10 text-primary" />
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Test de Rol/Arquetipo
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              La Cordada
            </p>

            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Descubre qué rol natural ocupas en un equipo de consultoría. Este test identifica
              tu arquetipo dominante y secundario entre 6 roles especializados.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 text-left">
              {roleCategories.map((category) => (
                <div key={category.id} className="bg-muted/50 rounded-lg p-3">
                  <h3 className="font-medium text-sm text-foreground">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {onSkip && (
                <Button variant="outline" onClick={onSkip} size="lg">
                  Omitir este test
                </Button>
              )}
              <Button onClick={handleStart} size="lg" className="gap-2">
                Comenzar Test
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              24 preguntas · 5 minutos aproximadamente
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de resultados
  if (state === 'results' && result) {
    return (
      <RoleResultsScreen
        result={result}
        onRestart={handleRestart}
        onComplete={onComplete ? () => onComplete(result) : undefined}
      />
    );
  }

  // Pantalla de preguntas
  const categoryInfo = roleCategories.find(c => c.id === currentQuestion.archetype);

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Test de Rol/Arquetipo</h1>
          <p className="text-muted-foreground mb-4">La Cordada</p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Pregunta {currentQuestionIndex + 1} de {roleQuestions.length}
              </span>
              <span className="font-medium text-primary">
                {categoryInfo?.name}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <RoleQuestionCard
          question={currentQuestion}
          categoryName={categoryInfo?.name || ''}
          selectedValue={answers.get(currentQuestion.id)}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isFirst={currentQuestionIndex === 0}
          isLast={currentQuestionIndex === roleQuestions.length - 1}
        />
      </div>
    </div>
  );
};

export default RoleAssessment;
