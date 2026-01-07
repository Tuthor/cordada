import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Plus,
  Clock
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  budget_min: number | null;
  budget_max: number | null;
  duration_weeks: number | null;
  expertise_needed: string[] | null;
  status: string;
  created_at: string;
  client_id: string;
  profiles: {
    full_name: string;
  } | null;
  client_companies: {
    company_name: string;
  } | null;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Abierto', variant: 'default' },
  in_progress: { label: 'En Progreso', variant: 'secondary' },
  completed: { label: 'Completado', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

const Projects = () => {
  const { userRole } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles!projects_client_id_fkey (
          full_name
        ),
        client_companies!client_companies_user_id_fkey (
          company_name
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data as unknown as Project[]);
    }
    setLoading(false);
  };

  const filteredProjects = projects.filter((project) => {
    const title = project.title.toLowerCase();
    const description = project.description.toLowerCase();
    const expertise = project.expertise_needed?.join(' ').toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return title.includes(search) || description.includes(search) || expertise.includes(search);
  });

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'A convenir';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `Desde $${min.toLocaleString()}`;
    return `Hasta $${max?.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
            <p className="text-muted-foreground">
              {userRole === 'client' 
                ? 'Gestiona tus proyectos publicados' 
                : 'Encuentra oportunidades de consultoría'}
            </p>
          </div>
          {userRole === 'client' && (
            <Button variant="gold" asChild>
              <Link to="/projects/new">
                <Plus className="w-4 h-4 mr-2" />
                Publicar Proyecto
              </Link>
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proyectos..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No hay proyectos
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : userRole === 'client'
                  ? 'Publica tu primer proyecto para recibir propuestas'
                  : 'Aún no hay proyectos disponibles'}
              </p>
              {userRole === 'client' && !searchTerm && (
                <Button variant="gold" className="mt-4" asChild>
                  <Link to="/projects/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Publicar Proyecto
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {project.title}
                        </h3>
                        <Badge variant={statusLabels[project.status]?.variant || 'default'}>
                          {statusLabels[project.status]?.label || project.status}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      {project.expertise_needed && project.expertise_needed.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.expertise_needed.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatBudget(project.budget_min, project.budget_max)}
                        </span>
                        {project.duration_weeks && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {project.duration_weeks} semanas
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(project.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      <p className="text-sm text-muted-foreground">
                        {project.client_companies?.company_name || project.profiles?.full_name || 'Cliente'}
                      </p>
                      <Button variant="gold">
                        {userRole === 'client' ? 'Ver Detalles' : 'Enviar Propuesta'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Projects;
