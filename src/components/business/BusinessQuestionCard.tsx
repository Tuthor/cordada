import { BusinessQuestion } from '@/types/businessDiagnostic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface BusinessQuestionCardProps {
  question: BusinessQuestion;
  selectedValue?: string | number;
  onAnswer: (value: string | number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  scaleOptions: { value: number; label: string }[];
}

const BusinessQuestionCard = ({
  question,
  selectedValue,
  onAnswer,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  scaleOptions,
}: BusinessQuestionCardProps) => {
  const canProceed = selectedValue !== undefined && selectedValue !== '';

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'text':
        // For longer text inputs like "position purpose"
        if (question.id === 'profile_purpose') {
          return (
            <Textarea
              value={(selectedValue as string) || ''}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder="Describa brevemente..."
              className="min-h-[100px]"
            />
          );
        }
        return (
          <Input
            value={(selectedValue as string) || ''}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Escriba su respuesta..."
            className="text-lg"
          />
        );

      case 'single_choice':
        return (
          <RadioGroup
            value={(selectedValue as string) || ''}
            onValueChange={(value) => onAnswer(value)}
            className="space-y-3"
          >
            {question.options?.map((option) => (
              <div
                key={option.value}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedValue === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                }`}
                onClick={() => onAnswer(option.value)}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Label
                  htmlFor={option.value}
                  className="flex-1 cursor-pointer text-base"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <RadioGroup
              value={selectedValue?.toString() || ''}
              onValueChange={(value) => onAnswer(parseInt(value))}
              className="space-y-3"
            >
              {scaleOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedValue === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  }`}
                  onClick={() => onAnswer(option.value)}
                >
                  <RadioGroupItem
                    value={option.value.toString()}
                    id={`scale-${option.value}`}
                  />
                  <Label
                    htmlFor={`scale-${option.value}`}
                    className="flex-1 cursor-pointer"
                  >
                    <span className="font-medium">{option.value}</span>
                    <span className="text-muted-foreground ml-2">
                      - {option.label}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="px-2 py-1 rounded bg-secondary text-xs font-medium">
            {question.section.name}
          </span>
        </div>
        <CardTitle className="text-xl leading-relaxed">{question.text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderQuestionInput()}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
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
            variant="gold"
            onClick={onNext}
            disabled={!canProceed}
            className="gap-2"
          >
            {isLast ? 'Ver Resultados' : 'Siguiente'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessQuestionCard;
