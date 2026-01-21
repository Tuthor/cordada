import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Shield, Target, CheckCircle, Mountain, TrendingUp, Flag, Users } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  const features = [
    {
      icon: Target,
      title: '4 Niveles de Madurez',
      description: 'Descubre tu posición actual como consultor independiente',
    },
    {
      icon: Clock,
      title: '5-10 Minutos',
      description: '20 preguntas diseñadas para profesionales ocupados',
    },
    {
      icon: Shield,
      title: 'Confidencial',
      description: 'Tus respuestas son seguras y privadas',
    },
  ];

  const levels = [
    { icon: Mountain, name: 'Campamento Base', description: 'Aprendiz consciente' },
    { icon: TrendingUp, name: 'Tramo de Ascenso', description: 'Ejecutor confiable' },
    { icon: Flag, name: 'Alta Montaña', description: 'Profesional maduro' },
    { icon: Users, name: 'Guía', description: 'Orquestador' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sección Hero */}
      <div className="bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 text-gold mb-6">
              <Mountain className="w-4 h-4" />
              <span className="text-sm font-medium">Test de Madurez - La Cordada</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              ¿En Qué Nivel de la{' '}
              <span className="text-gradient-gold">Montaña Estás?</span>
            </h1>
            <p className="text-lg lg:text-xl text-primary-foreground/80 mb-8 leading-relaxed">
              Evalúa tu madurez como consultor independiente. Descubre tus fortalezas, 
              áreas de desarrollo y el nivel de acompañamiento que necesitas para escalar con respaldo.
            </p>
            <Button variant="gold" size="xl" onClick={onStart} className="group">
              Iniciar Evaluación
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sección de Características */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl p-6 shadow-lg border border-border/50 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Los 4 Niveles */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Los 4 Niveles de Madurez
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {levels.map((level, index) => (
              <div
                key={level.name}
                className="flex flex-col items-center p-6 bg-secondary/50 rounded-xl text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <level.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{level.name}</h3>
                <p className="text-sm text-muted-foreground">{level.description}</p>
              </div>
            ))}
          </div>

          {/* Qué Evaluamos */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center text-foreground mb-8">
              ¿Qué Evaluamos?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Identidad profesional y propuesta de valor',
                'Experiencia comercial y gestión de proyectos',
                'Método, autonomía y sostenibilidad',
                'Liderazgo colectivo y mentoría',
                'Gestión de alcance, precios y riesgos',
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Botón duplicado al final */}
          <div className="text-center mt-10">
            <Button variant="gold" size="xl" onClick={onStart} className="group">
              Iniciar Evaluación
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
