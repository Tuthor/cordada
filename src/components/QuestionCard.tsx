import { useState } from 'react';
import { Question } from '@/types/assessment';
import { answerOptions } from '@/data/assessmentData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  selectedValue?: number;
  onAnswer: (value: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const QuestionCard = ({
  question,
  selectedValue,
  onAnswer,
  onNext,
  onPrevious,
  isFirst,
  isLast,
}: QuestionCardProps) => {
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  return (
    <div className="animate-scale-in">
      <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
        {/* Encabezado de Categoría */}
        <div className="bg-secondary/50 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {question.category.name}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              Bloque {question.blockCode}
            </span>
          </div>
        </div>

        {/* Pregunta */}
        <div className="p-6 lg:p-8">
          <h2 className="text-xl lg:text-2xl font-semibold text-foreground mb-8 leading-relaxed">
            {question.text}
          </h2>

          {/* Opciones de respuesta (1-5) */}
          <div className="space-y-3">
            {answerOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onAnswer(option.value)}
                onMouseEnter={() => setHoveredOption(option.value)}
                onMouseLeave={() => setHoveredOption(null)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border-2 transition-all duration-200',
                  selectedValue === option.value
                    ? 'border-gold bg-gold/10 shadow-gold'
                    : hoveredOption === option.value
                    ? 'border-primary/30 bg-secondary/50'
                    : 'border-border bg-background hover:border-primary/20'
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 font-semibold text-sm',
                      selectedValue === option.value
                        ? 'border-gold bg-gold text-accent-foreground'
                        : 'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {option.value}
                  </div>
                  <span className="font-medium text-foreground">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navegación */}
        <div className="px-6 lg:px-8 pb-6 lg:pb-8 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={onPrevious}
            disabled={isFirst}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </Button>
          <Button
            variant={isLast ? 'gold' : 'default'}
            onClick={onNext}
            disabled={selectedValue === undefined}
            className="gap-2"
          >
            {isLast ? 'Ver Resultados' : 'Siguiente'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
