import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  total: number;
  categoryName?: string;
}

const ProgressBar = ({ current, total, categoryName }: ProgressBarProps) => {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Question {current} of {total}
          {categoryName && <span className="text-foreground ml-2">• {categoryName}</span>}
        </span>
        <span className="text-sm font-semibold text-foreground">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-gold rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
