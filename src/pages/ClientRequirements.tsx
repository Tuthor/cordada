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
import { Plus, Trash2, Eye, CheckCircle, XCircle, Clock, FileText } from "lucide-react";

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
  reviewer_notes: string | null;
  consultant_name?: string;
}

export default function ClientRequirements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [newRequirement, setNewRequirement] = useState({ name: "", description: "" });
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchRequirements();
  }, [user, navigate]);

  const fetchRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from("client_requirements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequirements(data || []);

      // Fetch evidences for all requirements
      if (data && data.length > 0) {
        const { data: evidenceData, error: evidenceError } = await supabase
          .from("consultant_requirement_evidence")
          .select("*")
          .in("requirement_id", data.map(r => r.id));

        if (evidenceError) throw evidenceError;

        // Get consultant names
        if (evidenceData && evidenceData.length > 0) {
          const consultantIds = [...new Set(evidenceData.map(e => e.consultant_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", consultantIds);

          const evidencesWithNames = evidenceData.map(e => ({
            ...e,
            consultant_name: profiles?.find(p => p.user_id === e.consultant_id)?.full_name || "Desconocido"
          }));
          setEvidences(evidencesWithNames);
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

  const handleReviewEvidence = async (evidenceId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("consultant_requirement_evidence")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewNotes || null,
        })
        .eq("id", evidenceId);

      if (error) throw error;

      toast.success(status === "approved" ? "Evidencia aprobada" : "Evidencia rechazada");
      setSelectedEvidence(null);
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
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendiente revisión</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Sin enviar</Badge>;
    }
  };

  const getEvidencesForRequirement = (requirementId: string) => {
    return evidences.filter(e => e.requirement_id === requirementId && e.status === "submitted");
  };

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

        {requirements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay requisitos definidos</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crea requisitos para que los consultores puedan demostrar sus capacidades
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Crear primer requisito
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requirements.map((req) => {
              const pendingEvidences = getEvidencesForRequirement(req.id);
              return (
                <Card key={req.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{req.name}</CardTitle>
                        {req.description && (
                          <CardDescription className="mt-1">{req.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {pendingEvidences.length > 0 && (
                          <Badge variant="secondary">
                            {pendingEvidences.length} pendiente(s)
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRequirement(req.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {pendingEvidences.length > 0 && (
                    <CardContent>
                      <h4 className="font-medium mb-3">Evidencias pendientes de revisión:</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Consultor</TableHead>
                            <TableHead>Archivo</TableHead>
                            <TableHead>Fecha envío</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingEvidences.map((evidence) => (
                            <TableRow key={evidence.id}>
                              <TableCell>{evidence.consultant_name}</TableCell>
                              <TableCell>
                                {evidence.evidence_file_url ? (
                                  <a
                                    href={evidence.evidence_file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center"
                                  >
                                    <FileText className="w-4 h-4 mr-1" />
                                    {evidence.evidence_file_name || "Ver archivo"}
                                  </a>
                                ) : (
                                  "Sin archivo"
                                )}
                              </TableCell>
                              <TableCell>
                                {evidence.submitted_at
                                  ? new Date(evidence.submitted_at).toLocaleDateString()
                                  : "-"}
                              </TableCell>
                              <TableCell>{getStatusBadge(evidence.status)}</TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedEvidence(evidence)}
                                    >
                                      <Eye className="w-4 h-4 mr-1" /> Revisar
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Revisar Evidencia</DialogTitle>
                                      <DialogDescription>
                                        Consultor: {evidence.consultant_name}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      {evidence.evidence_file_url && (
                                        <div>
                                          <Label>Archivo adjunto:</Label>
                                          <a
                                            href={evidence.evidence_file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center mt-1"
                                          >
                                            <FileText className="w-4 h-4 mr-1" />
                                            {evidence.evidence_file_name || "Ver archivo"}
                                          </a>
                                        </div>
                                      )}
                                      <div className="space-y-2">
                                        <Label htmlFor="notes">Notas de revisión (opcional)</Label>
                                        <Textarea
                                          id="notes"
                                          placeholder="Agrega comentarios sobre la evidencia..."
                                          value={reviewNotes}
                                          onChange={(e) => setReviewNotes(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter className="gap-2">
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleReviewEvidence(evidence.id, "rejected")}
                                      >
                                        <XCircle className="w-4 h-4 mr-1" /> Rechazar
                                      </Button>
                                      <Button
                                        onClick={() => handleReviewEvidence(evidence.id, "approved")}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-1" /> Aprobar
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}