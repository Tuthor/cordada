import { useState } from 'react';
import { Question, Option } from '@/types/assessment';
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
          <span className="text-sm font-medium text-muted-foreground">
            {question.category.name}
          </span>
        </div>

        {/* Pregunta */}
        <div className="p-6 lg:p-8">
          <h2 className="text-xl lg:text-2xl font-semibold text-foreground mb-8 leading-relaxed">
            {question.text}
          </h2>

          {/* Opciones */}
          <div className="space-y-3">
            {question.options.map((option) => (
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
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200',
                      selectedValue === option.value
                        ? 'border-gold bg-gold'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {selectedValue === option.value && (
                      <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block">{option.label}</span>
                    {option.description && (
                      <span className="text-sm text-muted-foreground mt-1 block">
                        {option.description}
                      </span>
                    )}
                  </div>
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
