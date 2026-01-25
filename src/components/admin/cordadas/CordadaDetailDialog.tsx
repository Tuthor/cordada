import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cordada, CordadaMember, CordadaRitual, CordadaStatus } from "@/types/cordada";
import { getCordadaStatusInfo, cordadaStatuses } from "@/data/cordadaData";
import { useToast } from "@/hooks/use-toast";
import { Info, Users, Target, Calendar, Megaphone } from "lucide-react";
import { TeamManagement } from "./TeamManagement";
import { RitualsTimeline } from "./RitualsTimeline";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CordadaDetailDialogProps {
  cordada: Cordada;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function CordadaDetailDialog({ 
  cordada, 
  open, 
  onOpenChange,
  onUpdate 
}: CordadaDetailDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("info");
  const statusInfo = getCordadaStatusInfo(cordada.status);

  const { data: members, refetch: refetchMembers } = useQuery({
    queryKey: ['cordada-members', cordada.id],
    queryFn: async () => {
      const { data: membersData, error: membersError } = await supabase
        .from('cordada_members')
        .select('*')
        .eq('cordada_id', cordada.id);
      
      if (membersError) throw membersError;

      // Fetch consultant details
      const consultantIds = membersData.map(m => m.consultant_id);
      const { data: consultants } = await supabase
        .from('consultant_applications')
        .select('id, full_name, email, archetype, maturity_level')
        .in('id', consultantIds);

      return membersData.map(member => ({
        ...member,
        consultant: consultants?.find(c => c.id === member.consultant_id),
      })) as CordadaMember[];
    },
    enabled: open,
  });

  const { data: rituals, refetch: refetchRituals } = useQuery({
    queryKey: ['cordada-rituals', cordada.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cordada_rituals')
        .select('*')
        .eq('cordada_id', cordada.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as CordadaRitual[];
    },
    enabled: open,
  });

  const updateStatus = async (newStatus: CordadaStatus) => {
    try {
      const { error } = await supabase
        .from('cordadas')
        .update({ status: newStatus })
        .eq('id', cordada.id);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `La cordada ahora está en estado: ${getCordadaStatusInfo(newStatus).name}`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const publishCordada = async () => {
    await updateStatus('convocatoria' as CordadaStatus);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">{cordada.title}</DialogTitle>
              {cordada.client_company && (
                <p className="text-sm text-muted-foreground mt-1">{cordada.client_company}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={cordada.status} onValueChange={(v) => updateStatus(v as CordadaStatus)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cordadaStatuses.map(status => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="gap-2">
              <Info className="w-4 h-4" />
              Información
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" />
              Equipo ({members?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="rituals" className="gap-2">
              <Target className="w-4 h-4" />
              Rituales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {cordada.status === 'draft' && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Este desafío está en borrador</h4>
                      <p className="text-sm text-muted-foreground">
                        Publícalo para comenzar a formar el equipo
                      </p>
                    </div>
                    <Button onClick={publishCordada} className="gap-2">
                      <Megaphone className="w-4 h-4" />
                      Publicar Convocatoria
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{cordada.description || 'Sin descripción'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{cordada.client_name || 'No especificado'}</p>
                  <p className="text-sm text-muted-foreground">{cordada.client_company || ''}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Terreno (Contexto)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{cordada.terrain || 'No especificado'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Riesgos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{cordada.risks || 'No especificado'}</p>
                </CardContent>
              </Card>
            </div>

            {cordada.objectives && cordada.objectives.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Objetivos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {cordada.objectives.map((obj, idx) => (
                      <li key={idx} className="text-sm">{obj}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {cordada.required_expertise && cordada.required_expertise.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Expertise Requerida</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {cordada.required_expertise.map((exp, idx) => (
                      <Badge key={idx} variant="secondary">{exp}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Duración
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {cordada.estimated_duration_weeks 
                      ? `${cordada.estimated_duration_weeks} semanas` 
                      : 'No especificada'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{cordada.budget_range || 'No especificado'}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            <TeamManagement 
              cordadaId={cordada.id}
              members={members || []}
              requiredExpertise={cordada.required_expertise || []}
              onUpdate={refetchMembers}
            />
          </TabsContent>

          <TabsContent value="rituals" className="mt-4">
            <RitualsTimeline 
              cordadaId={cordada.id}
              rituals={rituals || []}
              cordadaStatus={cordada.status}
              onUpdate={refetchRituals}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
