import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, AlertTriangle, Calendar, FileText, Send, Copy, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { applicationStatuses, consultantArchetypes, getStatusInfo, getArchetypeInfo } from "@/data/orchestrationData";
import { ApplicationStatus, ConsultantArchetype } from "@/types/orchestration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApplicationDetailDialogProps {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

interface ApplicationData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  linkedin: string | null;
  status: ApplicationStatus;
  archetype: ConsultantArchetype | null;
  archetype_score: Record<string, number> | null;
  maturity_level: string | null;
  maturity_score: number | null;
  maturity_block_scores: Record<string, number> | null;
  role_archetype: string | null;
  role_archetype_secondary: string | null;
  interview_date: string | null;
  interview_notes: string | null;
  code_of_conduct_accepted: boolean;
  code_of_conduct_accepted_at: string | null;
  admin_notes: string | null;
  active_risk_alerts: string[] | null;
  user_id: string | null;
  invitation_token: string | null;
  invitation_sent_at: string | null;
  invitation_expires_at: string | null;
  data_consent_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function ApplicationDetailDialog({
  applicationId,
  open,
  onOpenChange,
  onUpdate,
}: ApplicationDetailDialogProps) {
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<ApplicationStatus>("postulacion");
  const [archetype, setArchetype] = useState<ConsultantArchetype | "">("");
  const [adminNotes, setAdminNotes] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (applicationId && open) {
      fetchApplication();
    }
  }, [applicationId, open]);

  const fetchApplication = async () => {
    if (!applicationId) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from("consultant_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la postulación",
        variant: "destructive",
      });
    } else if (data) {
      const appData = data as unknown as ApplicationData;
      setApplication(appData);
      setStatus(appData.status);
      setArchetype(appData.archetype || "");
      setAdminNotes(appData.admin_notes || "");
      setInterviewNotes(appData.interview_notes || "");
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!applicationId) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("consultant_applications")
      .update({
        status,
        archetype: archetype || null,
        admin_notes: adminNotes || null,
        interview_notes: interviewNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Guardado",
        description: "Los cambios fueron guardados correctamente",
      });
      onUpdate();
    }
    setIsSaving(false);
  };

  const activationLink = application?.invitation_token
    ? `${window.location.origin}/consultor/activar?token=${application.invitation_token}`
    : null;

  const invitationExpired =
    application?.invitation_expires_at
      ? new Date(application.invitation_expires_at) < new Date()
      : false;

  const handleSendInvitation = async () => {
    if (!applicationId) return;
    setIsInviting(true);
    const { data, error } = await supabase.functions.invoke("send-consultant-invitation", {
      body: { application_id: applicationId },
    });
    if (error || !data?.success) {
      toast({
        title: "Error al enviar invitación",
        description: data?.error || error?.message || "Intenta nuevamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Invitación enviada",
        description: `Enlace enviado a ${application?.email}.`,
      });
      await fetchApplication();
      onUpdate();
    }
    setIsInviting(false);
  };

  const handleCopyLink = async () => {
    if (!activationLink) return;
    await navigator.clipboard.writeText(activationLink);
    toast({ title: "Enlace copiado", description: "Comparte este enlace con el consultor." });
  };

  const handleDelete = async () => {
    if (!applicationId) return;
    setIsDeleting(true);
    const { data, error } = await supabase.functions.invoke("delete-consultant-application", {
      body: { application_id: applicationId },
    });
    if (error || !data?.success) {
      toast({
        title: "Error al eliminar",
        description: data?.error || error?.message || "Intenta nuevamente.",
        variant: "destructive",
      });
      setIsDeleting(false);
      return;
    }
    toast({ title: "Postulación eliminada" });
    setIsDeleting(false);
    setConfirmDeleteOpen(false);
    onOpenChange(false);
    onUpdate();
  };

  const getStatusBadgeVariant = (s: ApplicationStatus) => {
    switch (s) {
      case 'aceptado': return 'default';
      case 'rechazado': return 'destructive';
      case 'entrevista_pendiente':
      case 'entrevista_realizada': return 'secondary';
      default: return 'outline';
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Postulación</DialogTitle>
          <DialogDescription>
            Gestiona el estado y clasificación del postulante
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : application ? (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="classification">Clasificación</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Nombre</Label>
                  <p className="font-medium">{application.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <p className="font-medium">{application.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Teléfono</Label>
                  <p className="font-medium">{application.phone || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Empresa</Label>
                  <p className="font-medium">{application.company || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">LinkedIn</Label>
                  {application.linkedin ? (
                    <a 
                      href={application.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline block"
                    >
                      Ver perfil
                    </a>
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Fecha de Postulación</Label>
                  <p className="font-medium">
                    {new Date(application.created_at).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Nivel de Madurez</Label>
                  <p className="font-medium">
                    {application.maturity_level || "Sin evaluar"}
                    {application.maturity_score !== null && (
                      <span className="text-muted-foreground ml-2">
                        ({application.maturity_score}%)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Rol/Arquetipo Operativo</Label>
                  <p className="font-medium">
                    {application.role_archetype || "Sin evaluar"}
                    {application.role_archetype_secondary && (
                      <span className="text-muted-foreground ml-2">
                        / {application.role_archetype_secondary}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="classification" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Estado en el Embudo</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {applicationStatuses.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {getStatusInfo(status).description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Arquetipo de Consultor</Label>
                  <Select value={archetype} onValueChange={(v) => setArchetype(v as ConsultantArchetype)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar arquetipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {consultantArchetypes.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {archetype && (
                  <p className="text-sm text-muted-foreground">
                    {archetype && getArchetypeInfo(archetype as ConsultantArchetype).description}
                  </p>
                )}
              </div>

                {application.active_risk_alerts && application.active_risk_alerts.length > 0 && (
                  <div className="p-4 bg-destructive/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <Label className="text-destructive">Alertas de Riesgo Activas</Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {application.active_risk_alerts.map((alert) => (
                        <Badge key={alert} variant="destructive">
                          {alert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Notas de Entrevista</Label>
                <Textarea
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Agregar notas de la entrevista de validación..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Notas Administrativas</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Agregar notas internas..."
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">Código de Conducta: </span>
                  {application.code_of_conduct_accepted ? (
                    <span className="text-green-600">
                      Aceptado el{" "}
                      {application.code_of_conduct_accepted_at
                        ? new Date(application.code_of_conduct_accepted_at).toLocaleDateString("es-CL")
                        : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Pendiente</span>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : null}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
