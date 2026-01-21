import { RoleQuestion } from '@/types/roleAssessment';
import { roleAnswerOptions } from '@/data/roleAssessmentData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface RoleQuestionCardProps {
  question: RoleQuestion;
  categoryName: string;
  selectedValue?: number;
  onAnswer: (value: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const RoleQuestionCard = ({
  question,
  categoryName,
  selectedValue,
  onAnswer,
  onNext,
  onPrevious,
  isFirst,
  isLast,
}: RoleQuestionCardProps) => {
  return (
    <Card className="shadow-lg border-border">
      <CardContent className="p-6 lg:p-8">
        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {categoryName}
          </span>
        </div>

        {/* Question */}
        <h2 className="text-xl lg:text-2xl font-semibold text-foreground mb-8">
          {question.text}
        </h2>

        {/* Answer Options */}
        <RadioGroup
          value={selectedValue?.toString()}
          onValueChange={(value) => onAnswer(parseInt(value))}
          className="space-y-3"
        >
          {roleAnswerOptions.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:border-primary/50 ${
                selectedValue === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
              onClick={() => onAnswer(option.value)}
            >
              <RadioGroupItem
                value={option.value.toString()}
                id={`option-${option.value}`}
                className="shrink-0"
              />
              <Label
                htmlFor={`option-${option.value}`}
                className="flex-1 cursor-pointer font-normal"
              >
                <span className="font-medium text-muted-foreground mr-2">
                  {option.value}.
                </span>
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirst}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </Button>

          <Button
            onClick={onNext}
            disabled={selectedValue === undefined}
            className="gap-2"
          >
            {isLast ? (
              <>
                Ver Resultados
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleQuestionCard;
