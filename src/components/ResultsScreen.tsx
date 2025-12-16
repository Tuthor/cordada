import { AssessmentResult, MaturityLevelInfo } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { RefreshCw, Award, TrendingUp, CheckCircle, AlertCircle, ArrowRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

interface ResultsScreenProps {
  result: AssessmentResult;
  levelInfo: MaturityLevelInfo;
  onRestart: () => void;
  onEnroll: () => void;
}

const ResultsScreen = ({ result, levelInfo, onRestart, onEnroll }: ResultsScreenProps) => {
  const radarData = result.categoryScores.map((score) => ({
    category: score.categoryName.split(' ')[0],
    score: score.percentage,
    fullMark: 100,
  }));

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'emerging':
        return 'text-destructive';
      case 'developing':
        return 'text-orange-500';
      case 'proficient':
        return 'text-gold';
      case 'advanced':
        return 'text-success';
      case 'expert':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case 'emerging':
        return 'bg-destructive/10';
      case 'developing':
        return 'bg-orange-500/10';
      case 'proficient':
        return 'bg-gold/10';
      case 'advanced':
        return 'bg-success/10';
      case 'expert':
        return 'bg-primary/10';
      default:
        return 'bg-muted';
    }
  };

  const getScoreIcon = (percentage: number) => {
    if (percentage >= 75) return CheckCircle;
    if (percentage >= 50) return TrendingUp;
    return AlertCircle;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 75) return 'text-success';
    if (percentage >= 50) return 'text-gold';
    return 'text-orange-500';
  };

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-foreground mb-4">
            <Award className="w-4 h-4" />
            <span className="text-sm font-medium">Assessment Complete</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Your Results
          </h1>
        </div>

        {/* Main Score Card */}
        <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden mb-8 animate-slide-up">
          <div className="bg-gradient-hero text-primary-foreground p-8 text-center">
            <div className="text-6xl lg:text-7xl font-bold mb-2">
              {Math.round(result.overallPercentage)}%
            </div>
            <div className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold',
              getLevelBgColor(levelInfo.level),
              getLevelColor(levelInfo.level)
            )}>
              <Award className="w-5 h-5" />
              {levelInfo.name}
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <p className="text-lg text-foreground mb-4 leading-relaxed">
              {levelInfo.description}
            </p>
            <div className="bg-secondary/50 rounded-xl p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-2">Our Recommendation</h3>
              <p className="text-muted-foreground">{levelInfo.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-xl font-semibold text-foreground mb-4">Competency Overview</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(var(--gold))"
                    fill="hsl(var(--gold))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl font-semibold text-foreground mb-4">Category Scores</h2>
            <div className="space-y-4">
              {result.categoryScores.map((score) => {
                const Icon = getScoreIcon(score.percentage);
                return (
                  <div key={score.categoryId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', getScoreColor(score.percentage))} />
                        <span className="font-medium text-foreground">{score.categoryName}</span>
                      </div>
                      <span className={cn('font-semibold', getScoreColor(score.percentage))}>
                        {Math.round(score.percentage)}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          score.percentage >= 75 ? 'bg-success' : score.percentage >= 50 ? 'bg-gold' : 'bg-orange-500'
                        )}
                        style={{ width: `${score.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enrollment CTA */}
        <div className="mt-8 bg-gradient-hero rounded-2xl p-8 text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-primary-foreground mb-4">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Join Our Network</span>
          </div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-3">
            Ready to Connect with Enterprise Clients?
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Enroll in our consultant ecosystem to access exclusive opportunities with Fortune 500 
            companies and growing enterprises seeking your expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={onRestart} className="gap-2 bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20">
              <RefreshCw className="w-4 h-4" />
              Retake Assessment
            </Button>
            <Button onClick={onEnroll} variant="gold" size="xl" className="gap-2">
              Enroll Now
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
