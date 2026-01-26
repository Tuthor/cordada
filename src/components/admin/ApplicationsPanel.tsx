import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ClipboardList, Eye, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { applicationStatuses, getStatusInfo } from "@/data/orchestrationData";
import { ApplicationStatus } from "@/types/orchestration";
import { ApplicationDetailDialog } from "./ApplicationDetailDialog";
import { ImportEnrollmentDialog } from "./ImportEnrollmentDialog";

interface ApplicationRow {
  id: string;
  full_name: string;
  email: string;
  status: ApplicationStatus;
  archetype: string | null;
  maturity_level: string | null;
  maturity_score: number | null;
  created_at: string;
}

export function ApplicationsPanel() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("consultant_applications")
      .select("id, full_name, email, status, archetype, maturity_level, maturity_score, created_at")
      .neq("status", "aceptado")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las postulaciones",
        variant: "destructive",
      });
    } else {
      setApplications((data || []) as ApplicationRow[]);
    }
    setIsLoading(false);
  };

  const getStatusBadgeVariant = (status: ApplicationStatus) => {
    switch (status) {
      case 'aceptado':
        return 'default';
      case 'rechazado':
        return 'destructive';
      case 'entrevista_pendiente':
      case 'entrevista_realizada':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getArchetypeLabel = (archetype: string | null) => {
    if (!archetype) return null;
    const labels: Record<string, string> = {
      experto_silencioso: 'Experto Silencioso',
      ex_ejecutivo: 'Ex-Ejecutivo',
      tecnico_alto_nivel: 'Técnico Alto Nivel',
      consultor_incompleto: 'Consultor Incompleto',
      independiente_quemado: 'Independiente Quemado',
    };
    return labels[archetype] || archetype;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">Postulaciones</CardTitle>
            <CardDescription>
              {applications.length} postulación{applications.length !== 1 ? "es" : ""} en el sistema
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchApplications}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay postulaciones registradas</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowImportDialog(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Importar desde Postulantes
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Arquetipo</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.full_name}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(app.status)}>
                          {getStatusInfo(app.status).name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.archetype ? (
                          <Badge variant="outline">{getArchetypeLabel(app.archetype)}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin clasificar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.maturity_level || (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {app.maturity_score !== null ? `${app.maturity_score}%` : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(app.created_at).toLocaleDateString("es-CL")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedApplication(app.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ApplicationDetailDialog
        applicationId={selectedApplication}
        open={!!selectedApplication}
        onOpenChange={(open) => !open && setSelectedApplication(null)}
        onUpdate={fetchApplications}
      />

      <ImportEnrollmentDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={fetchApplications}
      />
    </>
  );
}
