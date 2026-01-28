import { Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Briefcase, 
  Users, 
  FileText, 
  GraduationCap, 
  ArrowRight,
  Building2,
  CheckCircle,
  Star,
  Handshake,
  Quote,
  ClipboardCheck
} from 'lucide-react';

const CONSULTANT_THRESHOLD = 20;
const COMPANY_THRESHOLD = 10;

const Home = () => {
  const { user } = useAuth();

  // Query to get platform stats
  const { data: platformStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const [consultantsResult, companiesResult, projectsResult] = await Promise.all([
        supabase
          .from('consultant_applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'aceptado'),
        supabase
          .from('client_companies')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published')
      ]);

      return {
        consultants: consultantsResult.count || 0,
        companies: companiesResult.count || 0,
        projects: projectsResult.count || 0
      };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const showRealStats = platformStats && 
    platformStats.consultants >= CONSULTANT_THRESHOLD && 
    platformStats.companies >= COMPANY_THRESHOLD;

  const features = [
    {
      icon: Users,
      title: 'Red de Consultores',
      description: 'Accede a consultores verificados con experiencia comprobada',
    },
    {
      icon: FileText,
      title: 'Proyectos & Propuestas',
      description: 'Publica proyectos y recibe propuestas de expertos calificados',
    },
    {
      icon: GraduationCap,
      title: 'Capacitación',
      description: 'Cursos especializados para desarrollo profesional continuo',
    },
  ];

  const stats = [
    { value: `${platformStats?.consultants || 0}+`, label: 'Consultores' },
    { value: `${platformStats?.companies || 0}+`, label: 'Empresas' },
    { value: `${platformStats?.projects || 0}+`, label: 'Proyectos' },
    { value: '95%', label: 'Satisfacción' },
  ];

  const motivationalQuotes = [
    {
      quote: "Tu expertise merece el escenario correcto",
      audience: "Consultores",
      icon: Users
    },
    {
      quote: "El talento que buscas está aquí",
      audience: "Empresas",
      icon: Building2
    },
    {
      quote: "Conecta. Crece. Transforma.",
      audience: "Comunidad",
      icon: Handshake
    },
    {
      quote: "Tu próximo gran proyecto te espera",
      audience: "Consultores",
      icon: Star
    },
  ];

  return (
    <HelmetProvider>
      <Helmet>
        <title>CORDADA | Ecosistema de Consultoría Empresarial</title>
        <meta
          name="description"
          content="Conecta con los mejores consultores del mercado. Plataforma líder para empresas que buscan talento consultor de élite."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-secondary backdrop-blur border-b border-border">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <span className="font-bold text-foreground">CORDADA</span>
                <span className="text-xs text-muted-foreground block">Ecosistema de Consultoría</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Button variant="gold" asChild>
                  <Link to="/dashboard">
                    Ir al Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/auth">Iniciar Sesión</Link>
                  </Button>
                  <Button variant="gold" asChild>
                    <Link to="/auth">Registrarse</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section 
          className="relative text-primary-foreground py-20 lg:py-32 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 40%, transparent 100%), url('/src/assets/hero-cordada.jpeg')` }}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mountaineer-red text-mountaineer-red-foreground mb-6">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Plataforma #1 de Consultoría B2B</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Conecta con los mejores{' '}
                <span className="text-gradient-gold">consultores del mercado</span>
              </h1>
              <p className="text-lg lg:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                La plataforma líder para empresas que buscan talento consultor de élite 
                y consultores que desean crecer profesionalmente.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="gold" size="xl" asChild>
                  <Link to="/auth" className="group">
                    Comenzar Ahora
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline-gold" size="xl" asChild>
                  <Link to="/evaluacion-consultor">
                    Evalúa tu Nivel
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-card border-b border-border">
          <div className="container mx-auto px-4">
            {showRealStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-3xl lg:text-4xl font-bold text-primary">{stat.value}</p>
                    <p className="text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {motivationalQuotes.map((item, index) => (
                  <div key={index} className="text-center p-4 rounded-lg bg-secondary/30">
                    <Quote className="w-6 h-6 text-gold mx-auto mb-3" />
                    <p className="text-lg font-medium text-foreground italic mb-2">
                      "{item.quote}"
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <item.icon className="w-4 h-4" />
                      <span>{item.audience}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Todo lo que necesitas en una plataforma
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Herramientas diseñadas para conectar empresas con el mejor talento consultor
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-gold mx-auto mb-4 flex items-center justify-center">
                      <feature.icon className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                ¿Cómo funciona?
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* For Clients */}
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                    <Building2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle>Para Empresas</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    {[
                      'Publica tu proyecto con requisitos específicos',
                      'Recibe propuestas de consultores calificados',
                      'Revisa perfiles y selecciona al mejor candidato',
                      'Gestiona el proyecto y la comunicación en un solo lugar',
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 mt-auto">
                    <Button variant="outline" className="w-full group" asChild>
                      <Link to="/diagnostico-empresarial">
                        <ClipboardCheck className="w-4 h-4 mr-2" />
                        Realizar Diagnóstico Empresarial
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* For Consultants */}
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gold flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <CardTitle>Para Consultores</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    {[
                      'Crea tu perfil profesional verificado',
                      'Explora proyectos que coincidan con tu expertise',
                      'Envía propuestas personalizadas',
                      'Crece profesionalmente con nuestra capacitación',
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 mt-auto">
                    <Button variant="gold" className="w-full group" asChild>
                      <Link to="/evaluacion-consultor">
                        <ClipboardCheck className="w-4 h-4 mr-2" />
                        Evaluar mi Nivel de Madurez
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* For Partners */}
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                    <Handshake className="w-6 h-6 text-foreground" />
                  </div>
                  <CardTitle>Para Partners</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    'Ofrece cursos y talleres a la comunidad',
                    'Define precios y duración de tu contenido',
                    'Gestiona inscripciones y pagos',
                    'Visualiza estadísticas de tus cursos en tiempo real',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{step}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section className="py-20 bg-gradient-hero text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              ¿Listo para transformar tu negocio?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Únete a la comunidad de empresas y consultores que están revolucionando 
              la forma de hacer consultoría.
            </p>
            <Button variant="gold" size="xl" asChild>
              <Link to="/auth" className="group">
                Crear Cuenta Gratis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card border-t border-border py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-accent-foreground" />
                </div>
                <span className="font-bold text-foreground">CORDADA</span>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  © 2026 CORDADA. Todos los derechos reservados.
                </p>
                <Link 
                  to="/admin/login" 
                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  •
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </HelmetProvider>
  );
};

export default Home;
