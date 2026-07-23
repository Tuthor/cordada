import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Mountain, Calendar, DollarSign, Users, Eye, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClientChallengeDetailDialog } from '@/components/client/ClientChallengeDetailDialog';
import { hasEffectiveClientFilter, type CordadaOpenFilters, type CordadaVisibilityMode } from '@/types/cordada';
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

type CordadaStatus = 'draft' | 'convocatoria' | 'en_curso' | 'cumbre_alcanzada' | 'cerrada';

interface Cordada {
  id: string;
  title: string;
  description: string | null;
  status: CordadaStatus;
  terrain: string | null;
  risks: string | null;
  objectives: string[] | null;
  required_expertise: string[] | null;
  budget_amount: number | null;
  budget_currency: string | null;
  estimated_duration_weeks: number | null;
  start_date: string | null;
  created_at: string;
  visibility_mode: CordadaVisibilityMode;
  open_filters: CordadaOpenFilters | null;
}

const statusConfig: Record<CordadaStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  convocatoria: { label: 'Publicado', variant: 'default' },
  en_curso: { label: 'En Curso', variant: 'outline' },
  cumbre_alcanzada: { label: 'Completado', variant: 'default' },
  cerrada: { label: 'Cerrada', variant: 'destructive' },
};

const ClientChallenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCordada, setSelectedCordada] = useState<Cordada | null>(null);

  const { data: cordadas, isLoading } = useQuery({
    queryKey: ['client-cordadas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cordadas')
        .select('*')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Cordada[];
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cordadas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-cordadas'] });
      toast({ title: 'Desafío eliminado', description: 'El desafío ha sido eliminado correctamente' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo eliminar el desafío', variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CordadaStatus }) => {
      const { error } = await supabase.from('cordadas').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-cordadas'] });
      toast({ title: 'Estado actualizado' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    },
  });

  const handlePublish = (cordada: Cordada) => {
    if (cordada.visibility_mode === 'open_filtered' && !hasEffectiveClientFilter(cordada.open_filters)) {
      toast({
        title: 'Faltan filtros',
        description:
          'Para publicar en modo abierto debes definir al menos un filtro efectivo (expertise requerido o disponibilidad).',
        variant: 'destructive',
      });
      return;
    }
    updateStatusMutation.mutate({ id: cordada.id, status: 'convocatoria' });
  };

  const formatBudget = (amount: number | null, currency: string | null) => {
    if (!amount) return 'Sin definir';
    const formatted = new Intl.NumberFormat('es-CL').format(amount);
    return `${currency || 'CLP'} ${formatted}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Desafíos</h1>
            <p className="text-muted-foreground">Gestiona tus desafíos de consultoría</p>
          </div>
          <Button asChild variant="gold">
            <Link to="/challenges/new">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Desafío
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-muted" />
              </Card>
            ))}
          </div>
        ) : cordadas?.length === 0 ? (
          <Card className="p-12 text-center">
            <Mountain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin desafíos aún</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer desafío para encontrar el equipo ideal
            </p>
            <Button asChild variant="gold">
              <Link to="/challenges/new">
                <Plus className="w-4 h-4 mr-2" />
                Crear Desafío
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cordadas?.map((cordada) => (
              <Card key={cordada.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{cordada.title}</CardTitle>
                    <Badge variant={statusConfig[cordada.status].variant}>
                      {statusConfig[cordada.status].label}
                    </Badge>
                  </div>
                  {cordada.description && (
                    <CardDescription className="line-clamp-2">{cordada.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {cordada.budget_amount && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatBudget(cordada.budget_amount, cordada.budget_currency)}
                      </div>
                    )}
                    {cordada.estimated_duration_weeks && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {cordada.estimated_duration_weeks} semanas
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCordada(cordada)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>

                    {cordada.status === 'draft' && (
                      <>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/challenges/${cordada.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar desafío?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(cordada.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          size="sm"
                          variant="gold"
                          onClick={() => updateStatusMutation.mutate({ id: cordada.id, status: 'convocatoria' })}
                        >
                          Publicar
                        </Button>
                      </>
                    )}

                    {cordada.status === 'convocatoria' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatusMutation.mutate({ id: cordada.id, status: 'draft' })}
                      >
                        Retractar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ClientChallengeDetailDialog
        cordada={selectedCordada}
        open={!!selectedCordada}
        onOpenChange={(open) => !open && setSelectedCordada(null)}
      />
    </DashboardLayout>
  );
};

export default ClientChallenges;
