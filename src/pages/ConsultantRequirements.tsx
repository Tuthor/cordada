import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle, XCircle, Clock, FileText, Send, User } from "lucide-react";

interface Requirement {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  created_at: string;
  client_name?: string;
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
}

export default function ConsultantRequirements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [myEvidences, setMyEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [currentRequirementId, setCurrentRequirementId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      // Fetch all requirements from all clients
      const { data: reqData, error: reqError } = await supabase
        .from("client_requirements")
        .select("*")
        .order("created_at", { ascending: false });

      if (reqError) throw reqError;

      // Get client names
      if (reqData && reqData.length > 0) {
        const clientIds = [...new Set(reqData.map(r => r.client_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", clientIds);

        const requirementsWithNames = reqData.map(r => ({
          ...r,
          client_name: profiles?.find(p => p.user_id === r.client_id)?.full_name || "Cliente"
        }));
        setRequirements(requirementsWithNames);
      } else {
        setRequirements([]);
      }

      // Fetch my evidences
      const { data: evidenceData, error: evidenceError } = await supabase
        .from("consultant_requirement_evidence")
        .select("*")
        .eq("consultant_id", user?.id);

      if (evidenceError) throw evidenceError;
      setMyEvidences(evidenceData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar los requisitos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("El archivo no debe superar los 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadEvidence = async () => {
    if (!selectedFile || !currentRequirementId || !user) return;

    setUploadingFor(currentRequirementId);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${currentRequirementId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("requirement-evidence")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("requirement-evidence")
        .getPublicUrl(fileName);

      // Check if evidence already exists
      const existingEvidence = myEvidences.find(e => e.requirement_id === currentRequirementId);

      if (existingEvidence) {
        // Update existing evidence
        const { error: updateError } = await supabase
          .from("consultant_requirement_evidence")
          .update({
            evidence_file_url: urlData.publicUrl,
            evidence_file_name: selectedFile.name,
            status: "pending",
            submitted_at: null,
          })
          .eq("id", existingEvidence.id);

        if (updateError) throw updateError;
      } else {
        // Create new evidence
        const { error: insertError } = await supabase
          .from("consultant_requirement_evidence")
          .insert({
            requirement_id: currentRequirementId,
            consultant_id: user.id,
            evidence_file_url: urlData.publicUrl,
            evidence_file_name: selectedFile.name,
            status: "pending",
          });

        if (insertError) throw insertError;
      }

      toast.success("Archivo subido exitosamente");
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
      setCurrentRequirementId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchData();
    } catch (error) {
      console.error("Error uploading evidence:", error);
      toast.error("Error al subir el archivo");
    } finally {
      setUploadingFor(null);
    }
  };

  const handleSubmitForReview = async (requirementId: string) => {
    const evidence = myEvidences.find(e => e.requirement_id === requirementId);
    if (!evidence) {
      toast.error("Primero debes subir un archivo de evidencia");
      return;
    }

    try {
      const { error } = await supabase
        .from("consultant_requirement_evidence")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", evidence.id);

      if (error) throw error;

      toast.success("Evidencia enviada para acreditación");
      fetchData();
    } catch (error) {
      console.error("Error submitting evidence:", error);
      toast.error("Error al enviar la evidencia");
    }
  };

  const getEvidenceForRequirement = (requirementId: string) => {
    return myEvidences.find(e => e.requirement_id === requirementId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Aprobado</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rechazado</Badge>;
      case "submitted":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> En revisión</Badge>;
      case "pending":
        return <Badge variant="outline"><Upload className="w-3 h-3 mr-1" /> Archivo listo</Badge>;
      default:
        return <Badge variant="outline"><FileText className="w-3 h-3 mr-1" /> Sin evidencia</Badge>;
    }
  };

  // Group requirements by client
  const requirementsByClient = requirements.reduce((acc, req) => {
    const clientName = req.client_name || "Cliente";
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(req);
    return acc;
  }, {} as Record<string, Requirement[]>);

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
        <div>
          <h1 className="text-3xl font-bold">Requisitos de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Sube evidencias y solicita acreditación para cumplir con los requisitos de los clientes
          </p>
        </div>

        {requirements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay requisitos disponibles</h3>
              <p className="text-muted-foreground text-center">
                Los clientes aún no han definido requisitos para consultores
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {Object.entries(requirementsByClient).map(([clientName, clientReqs]) => (
              <AccordionItem key={clientName} value={clientName} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold">{clientName}</span>
                    <Badge variant="outline">{clientReqs.length} requisitos</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {clientReqs.map((req) => {
                      const evidence = getEvidenceForRequirement(req.id);
                      const status = evidence?.status || "none";
                      const canSubmit = evidence && status === "pending";
                      const canUpload = !evidence || status === "pending" || status === "rejected";

                      return (
                        <Card key={req.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{req.name}</CardTitle>
                                {req.description && (
                                  <CardDescription className="mt-1">{req.description}</CardDescription>
                                )}
                              </div>
                              {getStatusBadge(status)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            {evidence?.reviewer_notes && status === "rejected" && (
                              <div className="mb-4 p-3 bg-destructive/10 rounded-md">
                                <p className="text-sm text-destructive">
                                  <strong>Motivo del rechazo:</strong> {evidence.reviewer_notes}
                                </p>
                              </div>
                            )}

                            {evidence?.evidence_file_url && (
                              <div className="mb-4">
                                <Label className="text-sm text-muted-foreground">Archivo actual:</Label>
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

                            <div className="flex gap-2">
                              {canUpload && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentRequirementId(req.id);
                                    setIsUploadDialogOpen(true);
                                  }}
                                >
                                  <Upload className="w-4 h-4 mr-1" />
                                  {evidence ? "Cambiar archivo" : "Subir evidencia"}
                                </Button>
                              )}
                              {canSubmit && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmitForReview(req.id)}
                                >
                                  <Send className="w-4 h-4 mr-1" /> Acreditar
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Evidencia</DialogTitle>
              <DialogDescription>
                Sube un archivo que demuestre el cumplimiento del requisito (máx. 10MB)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">Archivo de evidencia</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Archivo seleccionado: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsUploadDialogOpen(false);
                setSelectedFile(null);
                setCurrentRequirementId(null);
              }}>
                Cancelar
              </Button>
              <Button
                onClick={handleUploadEvidence}
                disabled={!selectedFile || uploadingFor === currentRequirementId}
              >
                {uploadingFor === currentRequirementId ? "Subiendo..." : "Subir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}