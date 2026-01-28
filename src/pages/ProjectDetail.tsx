import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClientCompliance } from '@/hooks/useClientCompliance';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  DollarSign, 
  Edit, 
  Trash2, 
  Send,
  Building2,
  User,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  AlertCircle
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

interface Profile {
  full_name: string;
}

interface ClientCompany {
  company_name: string;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Borrador', variant: 'outline' },
  open: { label: 'Abierto', variant: 'default' },
  in_progress: { label: 'En Progreso', variant: 'secondary' },
  completed: { label: 'Completado', variant: 'outline' },
  closed: { label: 'Cerrado', variant: 'secondary' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { isCompliantWithClient, hasAnyRequirements, loading: complianceLoading } = useClientCompliance();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<ClientCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const isOwner = user?.id === project?.client_id;
  const isConsultant = userRole !== 'client';
  const clientHasRequirements = project ? hasAnyRequirements(project.client_id) : false;
  const isCompliant = !clientHasRequirements || (project ? isCompliantWithClient(project.client_id) : true);
  const isLocked = isConsultant && clientHasRequirements && !isCompliant && !isOwner;

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  useEffect(() => {
    if (project && user && userRole !== 'client') {
      checkIfApplied();
    }
  }, [project, user, userRole]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el proyecto',
        variant: 'destructive',
      });
      navigate('/projects');
      return;
    }

    setProject(data);

    // Fetch profile and company separately
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', data.client_id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    }

    const { data: companyData } = await supabase
      .from('client_companies')
      .select('company_name')
      .eq('user_id', data.client_id)
      .maybeSingle();

    if (companyData) {
      setCompany(companyData);
    }

    setLoading(false);
  };

  const checkIfApplied = async () => {
    if (!user || !project) return;
    
    const { data } = await supabase
      .from('proposals')
      .select('id')
      .eq('project_id', project.id)
      .eq('consultant_id', user.id)
      .maybeSingle();

    setHasApplied(!!data);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!project) return;

    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', project.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Proyecto actualizado',
        description: `Estado cambiado a ${statusLabels[newStatus]?.label || newStatus}`,
      });
      setProject({ ...project, status: newStatus });
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el proyecto',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Proyecto eliminado',
        description: 'El proyecto ha sido eliminado exitosamente',
      });
      navigate('/projects');
    }
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
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading || complianceLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="animate-pulse">
            <CardContent className="p-8">
              <div className="h-8 bg-muted rounded w-1/2 mb-4" />
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link to="/projects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Desafíos
          </Link>
        </Button>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <Badge variant={statusLabels[project.status]?.variant || 'default'}>
                    {statusLabels[project.status]?.label || project.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-4">
                  {company ? (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {company.company_name}
                    </span>
                  ) : profile ? (
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {profile.full_name}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(project.created_at)}
                  </span>
                </CardDescription>
              </div>

              {/* Owner Actions */}
              {isOwner && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/projects/${project.id}/edit`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Link>
                  </Button>
                  
                  {project.status === 'draft' && (
                    <Button 
                      variant="gold" 
                      size="sm"
                      onClick={() => handleStatusChange('open')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Publicar
                    </Button>
                  )}
                  
                  {project.status === 'open' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange('draft')}
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        Despublicar
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleStatusChange('closed')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cerrar
                      </Button>
                    </>
                  )}

                  {project.status === 'in_progress' && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleStatusChange('completed')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completar
                    </Button>
                  )}

                  <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>¿Eliminar proyecto?</DialogTitle>
                        <DialogDescription>
                          Esta acción no se puede deshacer. El proyecto y todas sus propuestas serán eliminados permanentemente.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                          Eliminar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Consultant Actions */}
              {!isOwner && userRole !== 'client' && project.status === 'open' && !isLocked && (
                <Button 
                  variant="gold" 
                  disabled={hasApplied}
                  asChild={!hasApplied}
                >
                  {hasApplied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Ya postulaste
                    </>
                  ) : (
                    <Link to={`/projects/${project.id}/apply`}>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Propuesta
                    </Link>
                  )}
                </Button>
              )}

              {/* Locked state for consultant */}
              {isLocked && (
                <Button variant="outline" asChild>
                  <Link to="/consultant-requirements">
                    <Lock className="w-4 h-4 mr-2" />
                    Cumplir Requisitos
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>

          {/* Locked warning banner */}
          {isLocked && (
            <div className="mx-6 mb-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-orange-600">Acceso restringido</h4>
                <p className="text-sm text-orange-600/80 mt-1">
                  Debes cumplir con los requisitos de este cliente para poder ver los detalles completos y enviar propuestas.{' '}
                  <Link to="/consultant-requirements" className="underline font-medium">
                    Ver requisitos pendientes
                  </Link>
                </p>
              </div>
            </div>
          )}

          <CardContent className="space-y-6">
            {/* Key Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Presupuesto</p>
                <p className="font-semibold flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatBudget(project.budget_min, project.budget_max)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Duración</p>
                <p className="font-semibold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {project.duration_weeks ? `${project.duration_weeks} semanas` : 'A definir'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Publicado</p>
                <p className="font-semibold flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(project.created_at)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-3">Descripción del Desafío</h3>
              {isLocked ? (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <Lock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    Completa los requisitos del cliente para ver la descripción completa
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </p>
              )}
            </div>

            {/* Requirements */}
            {project.requirements && !isLocked && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Requisitos</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.requirements}
                  </p>
                </div>
              </>
            )}

            {/* Expertise */}
            {project.expertise_needed && project.expertise_needed.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Especialidades Requeridas</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.expertise_needed.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetail;