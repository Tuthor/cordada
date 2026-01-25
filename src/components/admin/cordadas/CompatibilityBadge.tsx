import { CompatibilityResult } from "@/hooks/useMatchmakingScore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CompatibilityBadgeProps {
  compatibility: CompatibilityResult;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CompatibilityBadge({ 
  compatibility, 
  showLabel = false,
  size = 'md' 
}: CompatibilityBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[32px]',
    md: 'text-sm px-2 py-0.5 min-w-[40px]',
    lg: 'text-base px-2.5 py-1 min-w-[48px]',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "inline-flex items-center gap-1.5 rounded-full font-medium text-white cursor-help",
            compatibility.color,
            sizeClasses[size]
          )}>
            <span>{compatibility.score}%</span>
            {showLabel && (
              <span className="hidden sm:inline">{compatibility.label}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <div className="space-y-1.5">
            <p className="font-semibold">{compatibility.label}</p>
            <div className="text-xs space-y-0.5">
              <div className="flex justify-between">
                <span>Arquetipo:</span>
                <span>{compatibility.breakdown.archetypeMatch} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Madurez:</span>
                <span>{compatibility.breakdown.maturityBonus} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Score:</span>
                <span>{compatibility.breakdown.scoreBonus} pts</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CompatibilityBarProps {
  score: number;
  className?: string;
}

export function CompatibilityBar({ score, className }: CompatibilityBarProps) {
  const getBarColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 55) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn("w-full h-2 bg-muted rounded-full overflow-hidden", className)}>
      <div 
        className={cn("h-full rounded-full transition-all duration-300", getBarColor(score))}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}
