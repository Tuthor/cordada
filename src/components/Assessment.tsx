import { useState, useMemo } from 'react';
import { Answer, AssessmentResult, CategoryScore } from '@/types/assessment';
import { questions, categories, getMaturityLevel } from '@/data/assessmentData';
import WelcomeScreen from './WelcomeScreen';
import QuestionCard from './QuestionCard';
import ProgressBar from './ProgressBar';
import ResultsScreen from './ResultsScreen';

type AssessmentState = 'welcome' | 'questions' | 'results';

const Assessment = () => {
  const [state, setState] = useState<AssessmentState>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());

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
    }
  };

  const handleRestart = () => {
    setState('welcome');
    setCurrentQuestionIndex(0);
    setAnswers(new Map());
  };

  const result = useMemo((): AssessmentResult | null => {
    if (state !== 'results') return null;

    const categoryScores: CategoryScore[] = categories.map((category) => {
      const categoryQuestions = questions.filter((q) => q.category.id === category.id);
      const totalScore = categoryQuestions.reduce((sum, q) => {
        return sum + (answers.get(q.id) || 0);
      }, 0);
      const maxScore = categoryQuestions.length * 4; // Max score per question is 4

      return {
        categoryId: category.id,
        categoryName: category.name,
        score: totalScore,
        maxScore,
        percentage: (totalScore / maxScore) * 100,
      };
    });

    const totalScore = categoryScores.reduce((sum, cs) => sum + cs.score, 0);
    const maxTotalScore = categoryScores.reduce((sum, cs) => sum + cs.maxScore, 0);
    const overallPercentage = (totalScore / maxTotalScore) * 100;
    const levelInfo = getMaturityLevel(overallPercentage);

    return {
      totalScore,
      maxTotalScore,
      overallPercentage,
      categoryScores,
      maturityLevel: levelInfo.level,
    };
  }, [state, answers]);

  if (state === 'welcome') {
    return <WelcomeScreen onStart={handleStart} />;
  }

  if (state === 'results' && result) {
    const levelInfo = getMaturityLevel(result.overallPercentage);
    return <ResultsScreen result={result} levelInfo={levelInfo} onRestart={handleRestart} />;
  }

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Consultant Maturity Assessment</h1>
          <ProgressBar
            current={currentQuestionIndex + 1}
            total={questions.length}
            categoryName={currentQuestion.category.name}
          />
        </div>

        {/* Question */}
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          selectedValue={answers.get(currentQuestion.id)}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isFirst={currentQuestionIndex === 0}
          isLast={currentQuestionIndex === questions.length - 1}
        />
      </div>
    </div>
  );
};

export default Assessment;
