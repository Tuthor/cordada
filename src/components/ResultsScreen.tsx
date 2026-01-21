import { AssessmentResult, MaturityLevelInfo } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { RefreshCw, Award, TrendingUp, CheckCircle, AlertCircle, ArrowRight, Users, Mountain, Flag, AlertTriangle } from 'lucide-react';
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
    category: score.categoryName,
    score: score.percentage,
    fullMark: 100,
  }));

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'campamento_base':
        return 'text-orange-500';
      case 'tramo_ascenso':
        return 'text-gold';
      case 'alta_montana':
        return 'text-success';
      case 'guia':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case 'campamento_base':
        return 'bg-orange-500/10';
      case 'tramo_ascenso':
        return 'bg-gold/10';
      case 'alta_montana':
        return 'bg-success/10';
      case 'guia':
        return 'bg-primary/10';
      default:
        return 'bg-muted';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'campamento_base':
        return Mountain;
      case 'tramo_ascenso':
        return TrendingUp;
      case 'alta_montana':
        return Flag;
      case 'guia':
        return Users;
      default:
        return Mountain;
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

  const LevelIcon = getLevelIcon(levelInfo.level);

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Encabezado */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-foreground mb-4">
            <Award className="w-4 h-4" />
            <span className="text-sm font-medium">Evaluación Completada</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Tus Resultados
          </h1>
          <p className="text-muted-foreground">Test de Madurez del Consultor - La Cordada</p>
        </div>

        {/* Tarjeta de Nivel Dominante */}
        <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden mb-8 animate-slide-up">
          <div className="bg-gradient-hero text-primary-foreground p-8">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center',
                getLevelBgColor(levelInfo.level)
              )}>
                <LevelIcon className={cn('w-10 h-10', getLevelColor(levelInfo.level))} />
              </div>
              <div className="text-center lg:text-left flex-1">
                <p className="text-primary-foreground/70 text-sm mb-1">{levelInfo.characteristic}</p>
                <h2 className="text-3xl lg:text-4xl font-bold mb-2">{levelInfo.name}</h2>
                <p className="text-primary-foreground/80 italic">"{levelInfo.phrase}"</p>
              </div>
              <div className="text-center">
                <div className="text-5xl lg:text-6xl font-bold">
                  {Math.round(result.overallPercentage)}%
                </div>
                <p className="text-primary-foreground/70 text-sm">Puntuación General</p>
              </div>
            </div>
          </div>

          {result.isInTransition && result.secondaryLevel && (
            <div className="bg-gold/10 border-t border-gold/20 px-6 py-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-gold" />
              <p className="text-foreground">
                <span className="font-semibold">En transición:</span> También muestras características de{' '}
                <span className="font-semibold">{result.secondaryLevel.name}</span>
              </p>
            </div>
          )}

          <div className="p-6 lg:p-8">
            <p className="text-lg text-foreground mb-6 leading-relaxed">
              {levelInfo.description}
            </p>
            
            {/* Fortalezas y Debilidades */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-success/5 rounded-xl p-4 border border-success/20">
                <h3 className="font-semibold text-success mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Fortalezas
                </h3>
                <ul className="space-y-2">
                  {levelInfo.strengths.map((strength, i) => (
                    <li key={i} className="text-muted-foreground flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-orange-500/5 rounded-xl p-4 border border-orange-500/20">
                <h3 className="font-semibold text-orange-500 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Áreas de Desarrollo
                </h3>
                <ul className="space-y-2">
                  {levelInfo.weaknesses.map((weakness, i) => (
                    <li key={i} className="text-muted-foreground flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Riesgo Principal */}
            <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/20 mb-6">
              <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Riesgo Principal
              </h3>
              <p className="text-muted-foreground">{levelInfo.mainRisk}</p>
            </div>

            {/* Recomendación */}
            <div className="bg-secondary/50 rounded-xl p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-2">Nuestra Recomendación</h3>
              <p className="text-muted-foreground">{levelInfo.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Resultados Detallados */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Gráfico Radar */}
          <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-xl font-semibold text-foreground mb-4">Perfil por Bloque</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Radar
                    name="Puntuación"
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

          {/* Desglose por Bloques */}
          <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl font-semibold text-foreground mb-4">Puntuaciones por Bloque</h2>
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

            {/* Información adicional */}
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Roles habilitados:</span>
                <span className="text-foreground font-medium text-right">{levelInfo.enabledRoles}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Apoyo necesario:</span>
                <span className="text-foreground font-medium text-right">{levelInfo.supportNeeded}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA de Inscripción */}
        <div className="mt-8 bg-gradient-hero rounded-2xl p-8 text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-primary-foreground mb-4">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Únete a La Cordada</span>
          </div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-3">
            ¿Listo para Escalar con Respaldo?
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Inscríbete en La Cordada para acceder a herramientas, acompañamiento y una red de consultores 
            que te ayudarán a consolidar tu práctica independiente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={onRestart} className="gap-2 bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20">
              <RefreshCw className="w-4 h-4" />
              Repetir Evaluación
            </Button>
            <Button onClick={onEnroll} variant="gold" size="xl" className="gap-2">
              Inscribirse Ahora
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
