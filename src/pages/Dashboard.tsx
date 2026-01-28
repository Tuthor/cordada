import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, Navigate } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  FileText, 
  TrendingUp, 
  ArrowRight,
  Plus,
  Eye
} from 'lucide-react';

const Dashboard = () => {
  const { user, userRole } = useAuth();

  // Redirect partners to their dedicated dashboard
  if (userRole === 'partner') {
    return <Navigate to="/partner" replace />;
  }

  const stats = [
    { label: 'Desafíos Activos', value: '12', icon: Briefcase, color: 'text-primary' },
    { label: 'Propuestas Enviadas', value: '24', icon: FileText, color: 'text-gold' },
    { label: 'Consultores Conectados', value: '8', icon: Users, color: 'text-success' },
    { label: 'Tasa de Éxito', value: '78%', icon: TrendingUp, color: 'text-primary' },
  ];

  const roleLabels: Record<string, string> = {
    client: 'Cliente (Empresa)',
    consultant: 'Consultor',
    consulting_firm: 'Empresa de Consultoría',
    partner: 'Partner',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bienvenido, {user?.user_metadata?.full_name || 'Usuario'}
            </h1>
            {userRole && roleLabels[userRole] && (
              <p className="text-muted-foreground">{roleLabels[userRole]}</p>
            )}
          </div>
          <div className="flex gap-3">
            {userRole === 'client' && (
              <Button variant="gold" asChild>
                <Link to="/projects/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Publicar Proyecto
                </Link>
              </Button>
            )}
            {(userRole === 'consultant' || userRole === 'consulting_firm') && (
              <Button variant="gold" asChild>
                <Link to="/projects">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Desafíos
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Directorio de Consultores
              </CardTitle>
              <CardDescription>
                Explora nuestra red de consultores verificados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full group" asChild>
                <Link to="/directory">
                  Explorar Directorio
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gold" />
                Desafíos Abiertos
              </CardTitle>
              <CardDescription>
                Encuentra oportunidades de consultoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full group" asChild>
                <Link to="/projects">
                  Ver Desafíos
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Capacitación
              </CardTitle>
              <CardDescription>
                Mejora tus habilidades con nuestros cursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full group" asChild>
                <Link to="/training">
                  Ver Cursos
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
