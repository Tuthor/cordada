import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Users,
  ClipboardCheck,
  ExternalLink,
  MessageSquare
} from "lucide-react";

interface Requirement {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Evidence {
  id: string;
  requirement_id: string;
  consultant_id: string;
  evidence_file_url: string | null;
  evidence_file_name: string | null;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  consultant_name?: string;
  requirement_name?: string;
}

interface ConsultantCompliance {
  consultant_id: string;
  consultant_name: string;
  totalRequirements: number;
  approvedCount: number;
  submittedCount: number;
  rejectedCount: number;
  pendingCount: number;
  isFullyCompliant: boolean;
  evidences: Evidence[];
}

export default function ClientRequirements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [consultantCompliance, setConsultantCompliance] = useState<ConsultantCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [newRequirement, setNewRequirement] = useState({ name: "", description: "" });
  const [reviewNotes, setReviewNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchRequirements();
  }, [user, navigate]);

  const fetchRequirements = async () => {
    try {
      // Fetch client's requirements
      const { data: reqData, error: reqError } = await supabase
        .from("client_requirements")
        .select("*")
        .eq("client_id", user?.id)
        .order("created_at", { ascending: false });

      if (reqError) throw reqError;
      setRequirements(reqData || []);

      // Fetch all evidences for client's requirements
      if (reqData && reqData.length > 0) {
        const { data: evidenceData, error: evidenceError } = await supabase
          .from("consultant_requirement_evidence")
          .select("*")
          .in("requirement_id", reqData.map(r => r.id));

        if (evidenceError) throw evidenceError;

        // Get consultant names
        if (evidenceData && evidenceData.length > 0) {
          const consultantIds = [...new Set(evidenceData.map(e => e.consultant_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", consultantIds);

          const evidencesWithDetails = evidenceData.map(e => ({
            ...e,
            consultant_name: profiles?.find(p => p.user_id === e.consultant_id)?.full_name || "Desconocido",
            requirement_name: reqData.find(r => r.id === e.requirement_id)?.name || "Requisito"
          }));
          setEvidences(evidencesWithDetails);

          // Calculate consultant compliance
          const complianceMap = new Map<string, ConsultantCompliance>();
          
          consultantIds.forEach(consultantId => {
            const consultantName = profiles?.find(p => p.user_id === consultantId)?.full_name || "Desconocido";
            const consultantEvidences = evidencesWithDetails.filter(e => e.consultant_id === consultantId);
            
            const approvedCount = consultantEvidences.filter(e => e.status === "approved").length;
            const submittedCount = consultantEvidences.filter(e => e.status === "submitted").length;
            const rejectedCount = consultantEvidences.filter(e => e.status === "rejected").length;
            const pendingCount = consultantEvidences.filter(e => e.status === "pending").length;
            
            complianceMap.set(consultantId, {
              consultant_id: consultantId,
              consultant_name: consultantName,
              totalRequirements: reqData.length,
              approvedCount,
              submittedCount,
              rejectedCount,
              pendingCount,
              isFullyCompliant: approvedCount === reqData.length,
              evidences: consultantEvidences
            });
          });

          setConsultantCompliance(Array.from(complianceMap.values()));
        } else {
          setEvidences([]);
          setConsultantCompliance([]);
        }
      }
    } catch (error) {
      console.error("Error fetching requirements:", error);
      toast.error("Error al cargar los requisitos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequirement = async () => {
    if (!newRequirement.name.trim()) {
      toast.error("El nombre del requisito es obligatorio");
      return;
    }

    try {
      const { error } = await supabase.from("client_requirements").insert({
        client_id: user?.id,
        name: newRequirement.name,
        description: newRequirement.description || null,
      });

      if (error) throw error;

      toast.success("Requisito agregado exitosamente");
      setNewRequirement({ name: "", description: "" });
      setIsAddDialogOpen(false);
      fetchRequirements();
    } catch (error) {
      console.error("Error adding requirement:", error);
      toast.error("Error al agregar el requisito");
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    try {
      const { error } = await supabase
        .from("client_requirements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Requisito eliminado");
      fetchRequirements();
    } catch (error) {
      console.error("Error deleting requirement:", error);
      toast.error("Error al eliminar el requisito");
    }
  };

  const handleReviewEvidence = async (status: "approved" | "rejected") => {
    if (!selectedEvidence) return;

    try {
      const { error } = await supabase
        .from("consultant_requirement_evidence")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewNotes || null,
        })
        .eq("id", selectedEvidence.id);

      if (error) throw error;

      toast.success(status === "approved" ? "Evidencia aprobada" : "Evidencia rechazada");
      setSelectedEvidence(null);
      setIsReviewDialogOpen(false);
      setReviewNotes("");
      fetchRequirements();
    } catch (error) {
      console.error("Error reviewing evidence:", error);
      toast.error("Error al revisar la evidencia");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Aprobado</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rechazado</Badge>;
      case "submitted":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
      default:
        return <Badge variant="outline"><FileText className="w-3 h-3 mr-1" /> Sin enviar</Badge>;
    }
  };

  const getEvidencesByStatus = (status: string | null) => {
    if (!status || status === "all") return evidences.filter(e => e.status !== "pending");
    return evidences.filter(e => e.status === status);
  };

  const pendingEvidences = evidences.filter(e => e.status === "submitted");
  const approvedEvidences = evidences.filter(e => e.status === "approved");
  const rejectedEvidences = evidences.filter(e => e.status === "rejected");
  const compliantConsultants = consultantCompliance.filter(c => c.isFullyCompliant);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Requisitos para Consultores</h1>
            <p className="text-muted-foreground mt-1">
              Define los requisitos que deben cumplir los consultores para trabajar contigo
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Nuevo Requisito
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Requisito</DialogTitle>
                <DialogDescription>
                  Define un nuevo requisito que los consultores deberán cumplir
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del requisito *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Certificación ISO 9001"
                    value={newRequirement.name}
                    onChange={(e) => setNewRequirement({ ...newRequirement, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe qué evidencia debe presentar el consultor"
                    value={newRequirement.description}
                    onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddRequirement}>Agregar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requisitos</p>
                  <p className="text-2xl font-bold">{requirements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">{pendingEvidences.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aprobados</p>
                  <p className="text-2xl font-bold">{approvedEvidences.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consultores Acreditados</p>
                  <p className="text-2xl font-bold">{compliantConsultants.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requirements List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lista de Requisitos</CardTitle>
            <CardDescription>
              {requirements.length === 0 
                ? "Aún no has definido requisitos para consultores"
                : "Requisitos que deben cumplir los consultores para trabajar contigo"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requirements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  Crea requisitos para que los consultores puedan demostrar sus capacidades
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Crear primer requisito
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {requirements.map((req) => (
                  <div 
                    key={req.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{req.name}</h4>
                      {req.description && (
                        <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRequirement(req.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evidences Review Section */}
        {requirements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revisión de Evidencias</CardTitle>
              <CardDescription>
                Revisa y aprueba las evidencias enviadas por los consultores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="pending" className="gap-2">
                    <Clock className="w-4 h-4" />
                    Pendientes ({pendingEvidences.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Aprobados ({approvedEvidences.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="gap-2">
                    <XCircle className="w-4 h-4" />
                    Rechazados ({rejectedEvidences.length})
                  </TabsTrigger>
                  <TabsTrigger value="consultants" className="gap-2">
                    <Users className="w-4 h-4" />
                    Por Consultor
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  {pendingEvidences.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay evidencias pendientes de revisión
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Consultor</TableHead>
                          <TableHead>Requisito</TableHead>
                          <TableHead>Archivo</TableHead>
                          <TableHead>Fecha envío</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingEvidences.map((evidence) => (
                          <TableRow key={evidence.id}>
                            <TableCell className="font-medium">{evidence.consultant_name}</TableCell>
                            <TableCell>{evidence.requirement_name}</TableCell>
                            <TableCell>
                              {evidence.evidence_file_url ? (
                                <a
                                  href={evidence.evidence_file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <FileText className="w-4 h-4" />
                                  {evidence.evidence_file_name || "Ver archivo"}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground">Sin archivo</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {evidence.submitted_at
                                ? new Date(evidence.submitted_at).toLocaleDateString("es-ES")
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEvidence(evidence);
                                  setIsReviewDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" /> Revisar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="approved">
                  {approvedEvidences.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay evidencias aprobadas aún
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Consultor</TableHead>
                          <TableHead>Requisito</TableHead>
                          <TableHead>Archivo</TableHead>
                          <TableHead>Fecha aprobación</TableHead>
                          <TableHead>Notas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedEvidences.map((evidence) => (
                          <TableRow key={evidence.id}>
                            <TableCell className="font-medium">{evidence.consultant_name}</TableCell>
                            <TableCell>{evidence.requirement_name}</TableCell>
                            <TableCell>
                              {evidence.evidence_file_url ? (
                                <a
                                  href={evidence.evidence_file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <FileText className="w-4 h-4" />
                                  Ver archivo
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {evidence.reviewed_at
                                ? new Date(evidence.reviewed_at).toLocaleDateString("es-ES")
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {evidence.reviewer_notes || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="rejected">
                  {rejectedEvidences.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay evidencias rechazadas
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Consultor</TableHead>
                          <TableHead>Requisito</TableHead>
                          <TableHead>Archivo</TableHead>
                          <TableHead>Fecha rechazo</TableHead>
                          <TableHead>Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rejectedEvidences.map((evidence) => (
                          <TableRow key={evidence.id}>
                            <TableCell className="font-medium">{evidence.consultant_name}</TableCell>
                            <TableCell>{evidence.requirement_name}</TableCell>
                            <TableCell>
                              {evidence.evidence_file_url ? (
                                <a
                                  href={evidence.evidence_file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <FileText className="w-4 h-4" />
                                  Ver archivo
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {evidence.reviewed_at
                                ? new Date(evidence.reviewed_at).toLocaleDateString("es-ES")
                                : "-"}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className="text-sm text-destructive truncate">
                                {evidence.reviewer_notes || "Sin motivo especificado"}
                              </p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="consultants">
                  {consultantCompliance.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Ningún consultor ha enviado evidencias aún
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {consultantCompliance.map((consultant) => (
                        <Card key={consultant.consultant_id} className={consultant.isFullyCompliant ? "border-green-500/50" : ""}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${consultant.isFullyCompliant ? "bg-green-500/10" : "bg-muted"}`}>
                                  <Users className={`w-5 h-5 ${consultant.isFullyCompliant ? "text-green-500" : "text-muted-foreground"}`} />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{consultant.consultant_name}</CardTitle>
                                  <CardDescription>
                                    {consultant.approvedCount}/{consultant.totalRequirements} requisitos aprobados
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {consultant.isFullyCompliant ? (
                                  <Badge className="bg-green-500 gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Acreditado
                                  </Badge>
                                ) : consultant.submittedCount > 0 ? (
                                  <Badge variant="secondary" className="gap-1">
                                    <Clock className="w-3 h-3" />
                                    {consultant.submittedCount} pendiente(s)
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">En proceso</Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {consultant.evidences.map((evidence) => (
                                <div 
                                  key={evidence.id} 
                                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{evidence.requirement_name}</p>
                                    {evidence.evidence_file_url && (
                                      <a
                                        href={evidence.evidence_file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                      >
                                        <FileText className="w-3 h-3" />
                                        {evidence.evidence_file_name || "Ver archivo"}
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(evidence.status)}
                                    {evidence.status === "submitted" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedEvidence(evidence);
                                          setIsReviewDialogOpen(true);
                                        }}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Revisar Evidencia</DialogTitle>
              <DialogDescription>
                {selectedEvidence?.consultant_name} - {selectedEvidence?.requirement_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedEvidence?.evidence_file_url && (
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm text-muted-foreground">Archivo adjunto:</Label>
                  <a
                    href={selectedEvidence.evidence_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2 mt-2 font-medium"
                  >
                    <FileText className="w-5 h-5" />
                    {selectedEvidence.evidence_file_name || "Ver archivo"}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comentarios (opcional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Agrega comentarios sobre la evidencia..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  El consultor verá estos comentarios en su panel
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="destructive"
                onClick={() => handleReviewEvidence("rejected")}
                className="gap-2"
              >
                <XCircle className="w-4 h-4" /> Rechazar
              </Button>
              <Button
                onClick={() => handleReviewEvidence("approved")}
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Aprobar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
