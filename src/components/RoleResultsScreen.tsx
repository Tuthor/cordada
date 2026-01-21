import { RoleAssessmentResult } from '@/types/roleAssessment';
import { roleCategories } from '@/data/roleAssessmentData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Mountain, Navigation, Shield, Compass, 
  Backpack, BookOpen, RotateCcw, ArrowRight,
  AlertTriangle, CheckCircle2, Users
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

const iconMap: Record<string, React.ReactNode> = {
  Mountain: <Mountain className="w-6 h-6" />,
  Navigation: <Navigation className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  Compass: <Compass className="w-6 h-6" />,
  Backpack: <Backpack className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
};

interface RoleResultsScreenProps {
  result: RoleAssessmentResult;
  onRestart: () => void;
  onComplete?: () => void;
}

const RoleResultsScreen = ({ result, onRestart, onComplete }: RoleResultsScreenProps) => {
  const { dominantArchetype, secondaryArchetype, archetypeScores, hasTie } = result;

  // Datos para el radar chart
  const radarData = archetypeScores.map((score) => ({
    subject: score.archetypeName.split(' ').slice(-1)[0], // Última palabra del nombre
    fullName: score.archetypeName,
    score: score.percentage,
    fullMark: 100,
  }));

  // Roles complementarios
  const complementaryRoles = dominantArchetype.complementaryRoles.map(roleId => 
    roleCategories.find(c => c.id === roleId)
  ).filter(Boolean);

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Tu Arquetipo en La Cordada
          </h1>
          <p className="text-muted-foreground">
            Resultados del Test de Rol/Arquetipo
          </p>
        </div>

        {/* Tie Warning */}
        {hasTie && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Empate detectado:</span> Tu perfil
                muestra igual afinidad por dos arquetipos. Considera ambos roles en tu práctica.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Result Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shrink-0">
                {iconMap[dominantArchetype.icon]}
              </div>
              <div className="flex-1">
                <Badge variant="secondary" className="mb-2">
                  Arquetipo Dominante
                </Badge>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
                  {dominantArchetype.name}
                </h2>
                <p className="text-lg text-primary font-medium mb-3">
                  {dominantArchetype.characteristic}
                </p>
                <p className="text-muted-foreground italic">
                  "{dominantArchetype.phrase}"
                </p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6 lg:p-8">
            <p className="text-foreground leading-relaxed mb-6">
              {dominantArchetype.description}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Fortalezas */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Fortalezas
                </h4>
                <ul className="space-y-2">
                  {dominantArchetype.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Debilidades potenciales */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Áreas de atención
                </h4>
                <ul className="space-y-2">
                  {dominantArchetype.potentialWeaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Best Context */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Mejor contexto de trabajo</h4>
              <p className="text-muted-foreground">{dominantArchetype.bestContext}</p>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Archetype */}
        {secondaryArchetype && (
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center text-secondary-foreground">
                  {iconMap[secondaryArchetype.icon]}
                </div>
                Arquetipo Secundario: {secondaryArchetype.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-3">
                {secondaryArchetype.description}
              </p>
              <p className="text-sm text-primary font-medium italic">
                "{secondaryArchetype.phrase}"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Radar Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Perfil de Arquetipos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Radar
                    name="Perfil"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Scores Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Puntuación por Arquetipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {archetypeScores
              .sort((a, b) => b.percentage - a.percentage)
              .map((score) => (
                <div key={score.archetypeId}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{score.archetypeName}</span>
                      {score.archetypeId === dominantArchetype.archetype && (
                        <Badge variant="default" className="text-xs">Dominante</Badge>
                      )}
                      {score.archetypeId === secondaryArchetype?.archetype && (
                        <Badge variant="secondary" className="text-xs">Secundario</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {score.score}/{score.maxScore} ({Math.round(score.percentage)}%)
                    </span>
                  </div>
                  <Progress value={score.percentage} className="h-2" />
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Complementary Roles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Roles Complementarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Como <span className="font-medium text-foreground">{dominantArchetype.name}</span>, 
              trabajas mejor junto a:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {complementaryRoles.map((role) => role && (
                <div 
                  key={role.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    {iconMap[role.icon]}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{role.name}</p>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={onRestart} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Repetir Test
          </Button>
          {onComplete && (
            <Button onClick={onComplete} className="gap-2">
              Continuar
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleResultsScreen;
