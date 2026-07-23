import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Send, 
  Building2, 
  Lock, 
  Unlock, 
  Briefcase,
  ChevronRight
} from "lucide-react";

interface Requirement {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  created_at: string;
  client_name?: string;
  company_name?: string;
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

interface ClientWithRequirements {
  client_id: string;
  client_name: string;
  company_name?: string;
  requirements: Requirement[];
  approvedCount: number;
  totalCount: number;
  isCompliant: boolean;
  projectCount: number;
}

export default function ConsultantRequirements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [myEvidences, setMyEvidences] = useState<Evidence[]>([]);
  const [clientsData, setClientsData] = useState<ClientWithRequirements[]>([]);
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

      // Get client names and companies
      if (reqData && reqData.length > 0) {
        const clientIds = [...new Set(reqData.map(r => r.client_id))];
        
        const [profilesResult, companiesResult, projectsResult] = await Promise.all([
          supabase.from("profiles").select("user_id, full_name").in("user_id", clientIds),
          supabase.from("client_companies").select("user_id, company_name").in("user_id", clientIds),
          supabase.from("cordadas").select("id, client_id").in("client_id", clientIds).eq("status", "convocatoria")
        ]);

        const requirementsWithNames = reqData.map(r => ({
          ...r,
          client_name: profilesResult.data?.find(p => p.user_id === r.client_id)?.full_name || "Cliente",
          company_name: companiesResult.data?.find(c => c.user_id === r.client_id)?.company_name
        }));
        setRequirements(requirementsWithNames);

        // Fetch my evidences
        const { data: evidenceData, error: evidenceError } = await supabase
          .from("consultant_requirement_evidence")
          .select("*")
          .eq("consultant_id", user?.id);

        if (evidenceError) throw evidenceError;
        setMyEvidences(evidenceData || []);

        // Group by client and calculate compliance
        const clientsMap = new Map<string, ClientWithRequirements>();
        
        requirementsWithNames.forEach(req => {
          if (!clientsMap.has(req.client_id)) {
            clientsMap.set(req.client_id, {
              client_id: req.client_id,
              client_name: req.client_name || "Cliente",
              company_name: req.company_name,
              requirements: [],
              approvedCount: 0,
              totalCount: 0,
              isCompliant: false,
              projectCount: projectsResult.data?.filter(p => p.client_id === req.client_id).length || 0
            });
          }
          
          const client = clientsMap.get(req.client_id)!;
          client.requirements.push(req);
          client.totalCount++;
          
          const evidence = evidenceData?.find(e => e.requirement_id === req.id);
          if (evidence?.status === "approved") {
            client.approvedCount++;
          }
        });

        // Update compliance status
        clientsMap.forEach(client => {
          client.isCompliant = client.totalCount > 0 && client.approvedCount === client.totalCount;
        });

        setClientsData(Array.from(clientsMap.values()));
      } else {
        setRequirements([]);
        setClientsData([]);
      }
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

      // Get signed URL (more secure than public URL for private bucket)
      // Use createSignedUrl with 1 year expiration for persistent access
      const { data: urlData, error: urlError } = await supabase.storage
        .from("requirement-evidence")
        .createSignedUrl(fileName, 31536000); // 1 year in seconds

      if (urlError) throw urlError;

      // Check if evidence already exists
      const existingEvidence = myEvidences.find(e => e.requirement_id === currentRequirementId);

      if (existingEvidence) {
        // Update existing evidence
        const { error: updateError } = await supabase
          .from("consultant_requirement_evidence")
          .update({
            evidence_file_url: urlData.signedUrl,
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
            evidence_file_url: urlData.signedUrl,
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

  const getComplianceColor = (approved: number, total: number) => {
    if (total === 0) return "bg-muted";
    const percentage = (approved / total) * 100;
    if (percentage === 100) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-orange-500";
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
        <div>
          <h1 className="text-3xl font-bold">Requisitos de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Cumple con los requisitos de cada cliente para poder ver y aplicar a sus proyectos
          </p>
        </div>

        {clientsData.length === 0 ? (
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
          <div className="space-y-4">
            {clientsData.map((client) => (
              <Card key={client.client_id} className={client.isCompliant ? "border-green-500/50" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${client.isCompliant ? "bg-green-500/10" : "bg-muted"}`}>
                        {client.isCompliant ? (
                          <Unlock className="w-5 h-5 text-green-500" />
                        ) : (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {client.company_name ? (
                            <>
                              <Building2 className="w-4 h-4" />
                              {client.company_name}
                            </>
                          ) : (
                            client.client_name
                          )}
                        </CardTitle>
                        {client.company_name && (
                          <CardDescription>{client.client_name}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {client.projectCount > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Briefcase className="w-3 h-3" />
                          {client.projectCount} proyecto{client.projectCount !== 1 ? "s" : ""} abierto{client.projectCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                      <Badge 
                        variant={client.isCompliant ? "default" : "secondary"}
                        className={client.isCompliant ? "bg-green-500" : ""}
                      >
                        {client.isCompliant ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Acceso completo
                          </>
                        ) : (
                          `${client.approvedCount}/${client.totalCount} aprobados`
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4">
                    <Progress 
                      value={client.totalCount > 0 ? (client.approvedCount / client.totalCount) * 100 : 0} 
                      className="h-2"
                    />
                  </div>

                  {client.isCompliant && client.projectCount > 0 && (
                    <div className="mt-4">
                      <Button variant="gold" asChild size="sm">
                        <Link to="/cordadas-abiertas">
                          Ver proyectos de este cliente
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="requirements" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-2">
                        <span className="text-sm text-muted-foreground">
                          Ver {client.totalCount} requisito{client.totalCount !== 1 ? "s" : ""}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {client.requirements.map((req) => {
                            const evidence = getEvidenceForRequirement(req.id);
                            const status = evidence?.status || "none";
                            const canSubmit = evidence && status === "pending";
                            const canUpload = !evidence || status === "pending" || status === "rejected";

                            return (
                              <Card key={req.id} className="bg-muted/30">
                                <CardHeader className="pb-2 pt-4 px-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <CardTitle className="text-sm font-medium">{req.name}</CardTitle>
                                      {req.description && (
                                        <CardDescription className="mt-1 text-xs">{req.description}</CardDescription>
                                      )}
                                    </div>
                                    {getStatusBadge(status)}
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0 pb-4 px-4">
                                  {evidence?.reviewer_notes && status === "rejected" && (
                                    <div className="mb-3 p-2 bg-destructive/10 rounded-md">
                                      <p className="text-xs text-destructive">
                                        <strong>Motivo del rechazo:</strong> {evidence.reviewer_notes}
                                      </p>
                                    </div>
                                  )}

                                  {evidence?.evidence_file_url && (
                                    <div className="mb-3">
                                      <a
                                        href={evidence.evidence_file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center text-sm"
                                      >
                                        <FileText className="w-3 h-3 mr-1" />
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
                                        <Upload className="w-3 h-3 mr-1" />
                                        {evidence ? "Cambiar" : "Subir"}
                                      </Button>
                                    )}
                                    {canSubmit && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleSubmitForReview(req.id)}
                                      >
                                        <Send className="w-3 h-3 mr-1" /> Acreditar
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
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
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
