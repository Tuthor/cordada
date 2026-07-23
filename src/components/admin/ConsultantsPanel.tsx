import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, UserCheck, Eye, AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getArchetypeInfo, getRiskAlertInfo } from "@/data/orchestrationData";
import { ConsultantArchetype, RiskAlertType } from "@/types/orchestration";
import { ApplicationDetailDialog } from "./ApplicationDetailDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ConsultantRow {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  archetype: ConsultantArchetype | null;
  maturity_level: string | null;
  maturity_score: number | null;
  role_archetype: string | null;
  active_risk_alerts: RiskAlertType[] | null;
  code_of_conduct_accepted: boolean;
  created_at: string;
}

export function ConsultantsPanel() {
  const [consultants, setConsultants] = useState<ConsultantRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConsultantRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConsultants();
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("delete-consultant-application", {
      body: { application_id: confirmDelete.id },
    });
    setDeleting(false);
    if (error || !data?.success) {
      toast({ title: "Error", description: data?.error || error?.message || "No se pudo eliminar", variant: "destructive" });
      return;
    }
    toast({ title: "Consultor eliminado" });
    setConfirmDelete(null);
    fetchConsultants();
  };


  const fetchConsultants = async () => {
    setIsLoading(true);
    
    // Get accepted consultants from consultant_applications
    const { data, error } = await supabase
      .from("consultant_applications")
      .select(`
        id,
        full_name,
        email,
        company,
        archetype,
        maturity_level,
        maturity_score,
        role_archetype,
        active_risk_alerts,
        code_of_conduct_accepted,
        created_at
      `)
      .eq("status", "aceptado")
      .order("full_name", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los consultores",
        variant: "destructive",
      });
      setConsultants([]);
    } else {
      setConsultants((data || []) as ConsultantRow[]);
    }
    
    setIsLoading(false);
  };

  const getMaturityBadgeVariant = (level: string | null) => {
    switch (level) {
      case 'Guía':
        return 'default';
      case 'Alta Montaña':
        return 'secondary';
      case 'Tramo de Ascenso':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getArchetypeLabel = (archetype: ConsultantArchetype | null) => {
    if (!archetype) return null;
    return getArchetypeInfo(archetype).name;
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return null;
    const roleLabels: Record<string, string> = {
      guia_alta_montana: 'Guía Alta Montaña',
      primer_de_cuerda: 'Primer de Cuerda',
      asegurador: 'Asegurador',
      explorador: 'Explorador',
      sherpa: 'Sherpa',
      cronista: 'Cronista',
    };
    return roleLabels[role] || role;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">Consultores Activos</CardTitle>
            <CardDescription>
              {consultants.length} consultor{consultants.length !== 1 ? "es" : ""} aceptado{consultants.length !== 1 ? "s" : ""} en el ecosistema
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchConsultants}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : consultants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay consultores aceptados aún</p>
              <p className="text-sm mt-2">Los postulantes aceptados aparecerán aquí</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Arquetipo</TableHead>
                    <TableHead>Rol Preferido</TableHead>
                    <TableHead>Nivel Madurez</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Alertas</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultants.map((consultant) => (
                    <TableRow key={consultant.id}>
                      <TableCell className="font-medium">{consultant.full_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{consultant.email}</TableCell>
                      <TableCell>
                        {consultant.archetype ? (
                          <Badge variant="outline">
                            {getArchetypeLabel(consultant.archetype)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {consultant.role_archetype ? (
                          <Badge variant="secondary">
                            {getRoleLabel(consultant.role_archetype)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {consultant.maturity_level ? (
                          <Badge variant={getMaturityBadgeVariant(consultant.maturity_level)}>
                            {consultant.maturity_level}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {consultant.maturity_score !== null ? `${consultant.maturity_score}%` : "-"}
                      </TableCell>
                      <TableCell>
                        {consultant.active_risk_alerts && consultant.active_risk_alerts.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            <span className="text-sm">{consultant.active_risk_alerts.length}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={consultant.code_of_conduct_accepted ? "default" : "outline"}>
                          {consultant.code_of_conduct_accepted ? "Aceptado" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedConsultant(consultant.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDelete(consultant)}
                            title="Eliminar consultor"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
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
        applicationId={selectedConsultant}
        open={!!selectedConsultant}
        onOpenChange={(open) => !open && setSelectedConsultant(null)}
        onUpdate={fetchConsultants}
      />
    </>
  );
}
