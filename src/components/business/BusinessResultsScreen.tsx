import { RespondentProfile, BusinessSectionScore } from '@/types/businessDiagnostic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  Users,
  TrendingUp,
  Cog,
  MessageSquare,
  Lightbulb,
  Crown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  industryOptions,
  companySizeOptions,
  functionalAreaOptions,
  decisionLevelOptions,
  areaRecommendations,
} from '@/data/businessDiagnosticData';

interface BusinessResultsScreenProps {
  respondentProfile: RespondentProfile;
  sectionScores: BusinessSectionScore[];
  overallScore: number;
  onRestart: () => void;
}

const sectionIcons: Record<string, React.ElementType> = {
  organizational_culture: Crown,
  leadership: Users,
  processes: Cog,
  people: TrendingUp,
  collaboration: MessageSquare,
  innovation: Lightbulb,
};

const BusinessResultsScreen = ({
  respondentProfile,
  sectionScores,
  overallScore,
  onRestart,
}: BusinessResultsScreenProps) => {
  const getStatusInfo = (percentage: number) => {
    if (percentage < 40) {
      return {
        status: 'critical' as const,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        icon: AlertTriangle,
        label: 'Requiere Atención',
      };
    } else if (percentage < 70) {
      return {
        status: 'warning' as const,
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        icon: AlertCircle,
        label: 'Oportunidad de Mejora',
      };
    } else {
      return {
        status: 'healthy' as const,
        color: 'text-success',
        bgColor: 'bg-success/10',
        icon: CheckCircle,
        label: 'Buen Desempeño',
      };
    }
  };

  const getOverallDiagnosis = () => {
    if (overallScore < 40) {
      return {
        title: 'Diagnóstico: Transformación Necesaria',
        description: 'Su organización presenta múltiples áreas que requieren intervención prioritaria. Recomendamos un programa integral de transformación organizacional.',
        color: 'text-destructive',
      };
    } else if (overallScore < 60) {
      return {
        title: 'Diagnóstico: Mejoras Significativas Requeridas',
        description: 'Existen oportunidades importantes de mejora en varias dimensiones. Un enfoque estructurado de consultoría puede acelerar su desarrollo.',
        color: 'text-warning',
      };
    } else if (overallScore < 80) {
      return {
        title: 'Diagnóstico: Organización en Desarrollo',
        description: 'Su organización tiene bases sólidas con áreas específicas de mejora. Intervenciones focalizadas pueden llevarla al siguiente nivel.',
        color: 'text-primary',
      };
    } else {
      return {
        title: 'Diagnóstico: Organización Madura',
        description: 'Su organización demuestra altos estándares en las dimensiones evaluadas. El foco debe estar en mantener y refinar las prácticas existentes.',
        color: 'text-success',
      };
    }
  };

  const getLabel = (value: string, options: { value: string; label: string }[]) => {
    return options.find(o => o.value === value)?.label || value;
  };

  const diagnosis = getOverallDiagnosis();
  const criticalAreas = sectionScores.filter(s => s.percentage < 40);
  const warningAreas = sectionScores.filter(s => s.percentage >= 40 && s.percentage < 70);

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Resultados del Diagnóstico
          </h1>
          <p className="text-muted-foreground">
            Análisis integral de su organización
          </p>
        </div>

        {/* Respondent Profile Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Perfil del Respondente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Empresa</p>
                <p className="font-medium">{respondentProfile.company || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Industria</p>
                <p className="font-medium">{getLabel(respondentProfile.industry, industryOptions)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tamaño</p>
                <p className="font-medium">{getLabel(respondentProfile.companySize, companySizeOptions)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Área</p>
                <p className="font-medium">{getLabel(respondentProfile.functionalArea, functionalAreaOptions)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cargo</p>
                <p className="font-medium">{respondentProfile.position || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nivel de Decisión</p>
                <p className="font-medium">{getLabel(respondentProfile.decisionLevel, decisionLevelOptions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Score */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-primary mb-2">
                {Math.round(overallScore)}%
              </div>
              <p className="text-muted-foreground">Índice de Salud Organizacional</p>
            </div>
            <Progress value={overallScore} className="h-3 mb-4" />
            <div className={`text-center ${diagnosis.color}`}>
              <h3 className="font-semibold text-lg">{diagnosis.title}</h3>
              <p className="text-muted-foreground mt-1">{diagnosis.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Section Scores */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Resultados por Dimensión</CardTitle>
            <CardDescription>
              Evaluación detallada de cada área organizacional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectionScores.map((section) => {
              const status = getStatusInfo(section.percentage);
              const Icon = sectionIcons[section.sectionId] || Building2;
              const StatusIcon = status.icon;

              return (
                <div
                  key={section.sectionId}
                  className={`p-4 rounded-lg ${status.bgColor}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${status.color}`} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{section.sectionName}</h4>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 ${status.color}`} />
                          <span className={`text-sm font-medium ${status.color}`}>
                            {Math.round(section.percentage)}%
                          </span>
                        </div>
                      </div>
                      <Progress value={section.percentage} className="h-2 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {section.interpretation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Priority Recommendations */}
        {(criticalAreas.length > 0 || warningAreas.length > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Recomendaciones Prioritarias</CardTitle>
              <CardDescription>
                Acciones sugeridas para las áreas con mayor oportunidad de mejora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {criticalAreas.map((area) => {
                const recommendations = areaRecommendations[area.sectionId as keyof typeof areaRecommendations] || [];
                return (
                  <div key={area.sectionId}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <h4 className="font-medium text-destructive">{area.sectionName}</h4>
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                        Prioritario
                      </span>
                    </div>
                    <ul className="space-y-2 ml-6">
                      {recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {warningAreas.slice(0, 2).map((area) => {
                const recommendations = areaRecommendations[area.sectionId as keyof typeof areaRecommendations] || [];
                return (
                  <div key={area.sectionId}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-warning" />
                      <h4 className="font-medium">{area.sectionName}</h4>
                    </div>
                    <ul className="space-y-2 ml-6">
                      {recommendations.slice(0, 2).map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6 text-center">
            <h3 className="text-xl font-bold mb-2">
              ¿Desea profundizar en el diagnóstico?
            </h3>
            <p className="text-primary-foreground/80 mb-6">
              Nuestros consultores expertos pueden ayudarle a desarrollar un plan 
              de acción personalizado para su organización.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gold" size="lg" asChild>
                <Link to="/auth" className="group">
                  Solicitar Consultoría
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onRestart}
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Repetir Diagnóstico
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="text-center mt-8">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BusinessResultsScreen;
