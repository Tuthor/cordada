import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClientCompliance } from '@/hooks/useClientCompliance';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Plus,
  Clock,
  Eye,
  Lock,
  AlertCircle,
  X,
  RotateCcw
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
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Borrador', variant: 'outline' },
  open: { label: 'Abierto', variant: 'default' },
  in_progress: { label: 'En Progreso', variant: 'secondary' },
  completed: { label: 'Completado', variant: 'outline' },
  closed: { label: 'Cerrado', variant: 'secondary' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

const Projects = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { isCompliantWithClient, hasAnyRequirements, loading: complianceLoading } = useClientCompliance();
  const [projects, setProjects] = useState<Project[]>([]);
  const [discardedProjectIds, setDiscardedProjectIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showDiscarded, setShowDiscarded] = useState(false);

  useEffect(() => {
    fetchProjects();
    if (userRole !== 'client') {
      fetchDiscardedProjects();
    }
  }, [user, userRole]);

  const fetchDiscardedProjects = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('discarded_projects')
      .select('project_id')
      .eq('user_id', user.id);
    
    if (data) {
      setDiscardedProjectIds(new Set(data.map(d => d.project_id)));
    }
  };

  const fetchProjects = async () => {
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    // Clients see their own projects, consultants see all open projects
    if (userRole === 'client' && user) {
      query = query.eq('client_id', user.id);
    } else {
      // Consultants only see open projects
      query = query.eq('status', 'open');
    }

    const { data, error } = await query;

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const handleDiscardProject = async (projectId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('discarded_projects')
      .insert({ user_id: user.id, project_id: projectId });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo descartar el proyecto',
        variant: 'destructive',
      });
      return;
    }

    setDiscardedProjectIds(prev => new Set([...prev, projectId]));
    toast({
      title: 'Proyecto descartado',
      description: 'El proyecto ha sido movido a descartados',
    });
  };

  const handleRestoreProject = async (projectId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('discarded_projects')
      .delete()
      .eq('user_id', user.id)
      .eq('project_id', projectId);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo restaurar el proyecto',
        variant: 'destructive',
      });
      return;
    }

    setDiscardedProjectIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(projectId);
      return newSet;
    });
    toast({
      title: 'Proyecto restaurado',
      description: 'El proyecto ha sido restaurado a la lista principal',
    });
  };

  const filteredProjects = projects.filter((project) => {
    const title = project.title.toLowerCase();
    const description = project.description.toLowerCase();
    const expertise = project.expertise_needed?.join(' ').toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = title.includes(search) || description.includes(search) || expertise.includes(search);
    
    // For consultants: filter by discarded status
    if (userRole !== 'client') {
      const isDiscarded = discardedProjectIds.has(project.id);
      if (showDiscarded && !isDiscarded) return false;
      if (!showDiscarded && isDiscarded) return false;
    }
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && project.status === activeTab;
  });

  const discardedCount = projects.filter(p => discardedProjectIds.has(p.id)).length;

  const getProjectCountByStatus = (status: string | null) => {
    if (!status) return projects.length;
    return projects.filter(p => p.status === status).length;
  };

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
            <h1 className="text-2xl font-bold text-foreground">Desafíos</h1>
            <p className="text-muted-foreground">
              {userRole === 'client' 
                ? 'Gestiona tus desafíos publicados' 
                : 'Encuentra oportunidades de consultoría'}
            </p>
          </div>
          {userRole === 'client' && (
            <Button variant="gold" asChild>
              <Link to="/projects/new">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Desafío
              </Link>
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar desafíos..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs for Clients */}
        {userRole === 'client' ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                Todos ({getProjectCountByStatus(null)})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Borradores ({getProjectCountByStatus('draft')})
              </TabsTrigger>
              <TabsTrigger value="open">
                Abiertos ({getProjectCountByStatus('open')})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                En Progreso ({getProjectCountByStatus('in_progress')})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Cerrados ({getProjectCountByStatus('closed')})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <ProjectList 
                projects={filteredProjects} 
                loading={loading || complianceLoading} 
                userRole={userRole}
                searchTerm={searchTerm}
                formatBudget={formatBudget}
                formatDate={formatDate}
                isCompliantWithClient={isCompliantWithClient}
                hasAnyRequirements={hasAnyRequirements}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {/* Toggle for discarded projects */}
            <div className="flex gap-2">
              <Button
                variant={!showDiscarded ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDiscarded(false)}
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Disponibles ({projects.length - discardedCount})
              </Button>
              <Button
                variant={showDiscarded ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDiscarded(true)}
              >
                <X className="w-4 h-4 mr-2" />
                Descartados ({discardedCount})
              </Button>
            </div>

            <ProjectList 
              projects={filteredProjects} 
              loading={loading || complianceLoading} 
              userRole={userRole}
              searchTerm={searchTerm}
              formatBudget={formatBudget}
              formatDate={formatDate}
              isCompliantWithClient={isCompliantWithClient}
              hasAnyRequirements={hasAnyRequirements}
              showDiscarded={showDiscarded}
              onDiscardProject={handleDiscardProject}
              onRestoreProject={handleRestoreProject}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  userRole: string | null;
  searchTerm: string;
  formatBudget: (min: number | null, max: number | null) => string;
  formatDate: (dateString: string) => string;
  isCompliantWithClient?: (clientId: string) => boolean;
  hasAnyRequirements?: (clientId: string) => boolean;
  showDiscarded?: boolean;
  onDiscardProject?: (projectId: string) => Promise<void>;
  onRestoreProject?: (projectId: string) => Promise<void>;
}

const ProjectList = ({ 
  projects, 
  loading, 
  userRole, 
  searchTerm, 
  formatBudget, 
  formatDate,
  isCompliantWithClient,
  hasAnyRequirements,
  showDiscarded,
  onDiscardProject,
  onRestoreProject
}: ProjectListProps) => {
  if (loading) {
    return (
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
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No hay desafíos
          </h3>
          <p className="text-muted-foreground text-center max-w-md">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : userRole === 'client'
              ? 'Publica tu primer desafío para recibir propuestas'
              : 'Aún no hay desafíos disponibles'}
          </p>
          {userRole === 'client' && !searchTerm && (
            <Button variant="gold" className="mt-4" asChild>
              <Link to="/projects/new">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Desafío
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const isConsultant = userRole !== 'client';
        const clientHasRequirements = isConsultant && hasAnyRequirements?.(project.client_id);
        const isCompliant = !clientHasRequirements || isCompliantWithClient?.(project.client_id);
        const isLocked = isConsultant && clientHasRequirements && !isCompliant;

        return (
          <Card key={project.id} className={`hover:shadow-lg transition-shadow ${isLocked ? 'opacity-75' : ''}`}>
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
                    {isLocked && (
                      <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
                        <Lock className="w-3 h-3" />
                        Requisitos pendientes
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {project.expertise_needed && project.expertise_needed.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.expertise_needed.slice(0, 4).map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {project.expertise_needed.length > 4 && (
                        <Badge variant="secondary">
                          +{project.expertise_needed.length - 4}
                        </Badge>
                      )}
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

                  {isLocked && (
                    <div className="mt-4 p-3 bg-orange-500/10 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-orange-600">
                        Debes cumplir con los requisitos de este cliente para poder ver y aplicar a este proyecto.{' '}
                        <Link to="/consultant-requirements" className="underline font-medium">
                          Ver requisitos
                        </Link>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 lg:items-end">
                  {isLocked ? (
                    <Button variant="outline" asChild>
                      <Link to="/consultant-requirements">
                        <Lock className="w-4 h-4 mr-2" />
                        Cumplir Requisitos
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant="gold" asChild>
                        <Link to={`/projects/${project.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          {userRole === 'client' ? 'Ver Detalles' : 'Ver Desafío'}
                        </Link>
                      </Button>
                      
                      {/* Discard/Restore button for consultants */}
                      {userRole !== 'client' && (
                        showDiscarded ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onRestoreProject?.(project.id)}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restaurar
                          </Button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                                <X className="w-4 h-4 mr-2" />
                                Descartar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Descartar este proyecto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  El proyecto será movido a tu lista de descartados. Podrás restaurarlo en cualquier momento.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDiscardProject?.(project.id)}>
                                  Descartar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Projects;
