import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ClipboardCheck, TrendingUp, Users, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BusinessWelcomeScreenProps {
  onStart: () => void;
}

const BusinessWelcomeScreen = ({ onStart }: BusinessWelcomeScreenProps) => {
  const benefits = [
    {
      icon: ClipboardCheck,
      title: 'Diagnóstico Integral',
      description: 'Evaluamos 6 dimensiones críticas de su organización',
    },
    {
      icon: TrendingUp,
      title: 'Identificación de Oportunidades',
      description: 'Detecte áreas de mejora con alto impacto potencial',
    },
    {
      icon: Users,
      title: 'Perspectiva Experta',
      description: 'Basado en mejores prácticas de consultoría empresarial',
    },
  ];

  const dimensions = [
    'Cultura Organizacional',
    'Liderazgo y Dirección',
    'Procesos y Operaciones',
    'Gestión del Talento',
    'Colaboración y Comunicación',
    'Innovación y Cambio',
  ];

  return (
    <div className="min-h-screen bg-background py-8 lg:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-6">
            <Building2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Diagnóstico Empresarial
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra las fortalezas y oportunidades de mejora de su organización 
            con nuestro diagnóstico integral basado en mejores prácticas de consultoría.
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="text-center">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{benefit.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dimensions Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Dimensiones que evaluaremos</CardTitle>
            <CardDescription>
              El diagnóstico cubre las áreas clave que determinan el éxito organizacional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dimensions.map((dimension) => (
                <div
                  key={dimension}
                  className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm text-foreground">{dimension}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Estimate */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-8">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Tiempo estimado: 10-15 minutos</span>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button variant="gold" size="xl" onClick={onStart} className="group">
            Comenzar Diagnóstico
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Sus respuestas son confidenciales y serán utilizadas únicamente para generar su diagnóstico.
          </p>
          <div className="pt-4">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessWelcomeScreen;
