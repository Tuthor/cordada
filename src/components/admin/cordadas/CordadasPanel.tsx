import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Mountain, Users, Calendar, ChevronRight } from "lucide-react";
import { Cordada } from "@/types/cordada";
import { getCordadaStatusInfo } from "@/data/cordadaData";
import { CreateCordadaDialog } from "./CreateCordadaDialog";
import { CordadaDetailDialog } from "./CordadaDetailDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function CordadasPanel() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCordada, setSelectedCordada] = useState<Cordada | null>(null);

  const { data: cordadas, isLoading, refetch } = useQuery({
    queryKey: ['cordadas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cordadas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Cordada[];
    },
  });

  const { data: memberCounts } = useQuery({
    queryKey: ['cordada-member-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cordada_members')
        .select('cordada_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(member => {
        counts[member.cordada_id] = (counts[member.cordada_id] || 0) + 1;
      });
      return counts;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const groupedCordadas = {
    active: cordadas?.filter(c => ['convocatoria', 'en_curso'].includes(c.status)) || [],
    completed: cordadas?.filter(c => c.status === 'cumbre_alcanzada') || [],
    draft: cordadas?.filter(c => c.status === 'draft') || [],
    closed: cordadas?.filter(c => c.status === 'cerrada') || [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cordadas (Desafíos)</h2>
          <p className="text-muted-foreground">
            Gestiona los proyectos colaborativos y equipos multidisciplinarios
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Desafío
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedCordadas.active.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cumbres Alcanzadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{groupedCordadas.completed.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Borradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{groupedCordadas.draft.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cerradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{groupedCordadas.closed.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Cordadas */}
      {groupedCordadas.active.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mountain className="w-5 h-5" />
            Cordadas Activas
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {groupedCordadas.active.map(cordada => {
              const statusInfo = getCordadaStatusInfo(cordada.status);
              return (
                <Card 
                  key={cordada.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCordada(cordada)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{cordada.title}</CardTitle>
                        {cordada.client_company && (
                          <p className="text-sm text-muted-foreground">{cordada.client_company}</p>
                        )}
                      </div>
                      <Badge className={statusInfo.color}>{statusInfo.name}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {cordada.description || 'Sin descripción'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {memberCounts?.[cordada.id] || 0} miembros
                        </span>
                        {cordada.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(cordada.start_date), 'dd MMM yyyy', { locale: es })}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Draft Cordadas */}
      {groupedCordadas.draft.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">Borradores</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedCordadas.draft.map(cordada => (
              <Card 
                key={cordada.id} 
                className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
                onClick={() => setSelectedCordada(cordada)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{cordada.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {cordada.description || 'Sin descripción'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {cordadas?.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Mountain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No hay cordadas aún</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer desafío para comenzar a orquestar equipos
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Crear Desafío
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateCordadaDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />

      {selectedCordada && (
        <CordadaDetailDialog
          cordada={selectedCordada}
          open={!!selectedCordada}
          onOpenChange={(open) => !open && setSelectedCordada(null)}
          onUpdate={() => refetch()}
        />
      )}
    </div>
  );
}
