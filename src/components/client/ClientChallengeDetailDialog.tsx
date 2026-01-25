import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mountain, Calendar, DollarSign, Target, AlertTriangle, Users, Check, X, Clock, Linkedin, Building2, User, ExternalLink } from 'lucide-react';
import { useState } from 'react';

type CordadaStatus = 'draft' | 'convocatoria' | 'en_curso' | 'cumbre_alcanzada' | 'cerrada';
type CordadaRole = 'guia_alta_montana' | 'primer_de_cuerda' | 'asegurador' | 'explorador' | 'sherpa' | 'cronista';

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
}

interface ConsultantProfile {
  id: string;
  full_name: string;
  email?: string;
  company?: string | null;
  linkedin?: string | null;
  archetype?: string | null;
  maturity_level?: string | null;
  maturity_score?: number | null;
}

interface CordadaMember {
  id: string;
  role: CordadaRole;
  client_status: string | null;
  client_feedback: string | null;
  consultant: ConsultantProfile | null;
}

interface Props {
  cordada: Cordada | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleLabels: Record<CordadaRole, string> = {
  guia_alta_montana: 'Guía de Alta Montaña',
  primer_de_cuerda: 'Primer de Cuerda',
  asegurador: 'Asegurador',
  explorador: 'Explorador',
  sherpa: 'Sherpa',
  cronista: 'Cronista',
};

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendiente: { label: 'Pendiente', variant: 'secondary' },
  aprobado: { label: 'Aprobado', variant: 'default' },
  rechazado: { label: 'Rechazado', variant: 'destructive' },
};

const archetypeLabels: Record<string, string> = {
  experto_silencioso: 'Experto Silencioso',
  ex_ejecutivo: 'Ex-Ejecutivo',
  tecnico_alto_nivel: 'Técnico de Alto Nivel',
  consultor_incompleto: 'Consultor en Desarrollo',
  independiente_quemado: 'Independiente Experimentado',
};

const ConsultantProfilePopover = ({ consultant }: { consultant: ConsultantProfile }) => (
  <PopoverContent className="w-72" align="start">
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-primary" />
        <span className="font-semibold">{consultant.full_name}</span>
      </div>
      
      {consultant.company && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="w-4 h-4" />
          <span>{consultant.company}</span>
        </div>
      )}
      
      {consultant.linkedin && (
        <Button variant="outline" size="sm" className="w-full gap-2" asChild>
          <a href={consultant.linkedin} target="_blank" rel="noopener noreferrer">
            <Linkedin className="w-4 h-4" />
            Ver LinkedIn
            <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      )}
    </div>
  </PopoverContent>
);

export const ClientChallengeDetailDialog = ({ cordada, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['cordada-members-client', cordada?.id],
    queryFn: async () => {
      if (!cordada?.id) return [];
      
      // Get the members without the join (client can access cordada_members via RLS)
      const { data: membersData, error: membersError } = await supabase
        .from('cordada_members')
        .select('id, role, client_status, client_feedback, consultant_id')
        .eq('cordada_id', cordada.id);

      if (membersError) throw membersError;
      if (!membersData || membersData.length === 0) return [];

      // Fetch consultant details - now client has RLS access to consultants in their cordadas
      const consultantIds = membersData.map(m => m.consultant_id);
      const { data: consultants } = await supabase
        .from('consultant_applications')
        .select('id, full_name, email, company, linkedin, archetype, maturity_level, maturity_score')
        .in('id', consultantIds);

      // Map consultants to members
      return membersData.map(member => ({
        ...member,
        consultant: consultants?.find(c => c.id === member.consultant_id) || { id: member.consultant_id, full_name: 'Consultor asignado' },
      })) as CordadaMember[];
    },
    enabled: !!cordada?.id && cordada.status !== 'draft',
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, status, feedback }: { memberId: string; status: string; feedback?: string }) => {
      const updateData: { client_status: string; client_feedback?: string } = { client_status: status };
      if (feedback !== undefined) {
        updateData.client_feedback = feedback;
      }
      const { error } = await supabase
        .from('cordada_members')
        .update(updateData)
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cordada-members-client', cordada?.id] });
      toast({ title: 'Feedback guardado' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo guardar el feedback', variant: 'destructive' });
    },
  });

  const formatBudget = (amount: number | null, currency: string | null) => {
    if (!amount) return 'Sin definir';
    const formatted = new Intl.NumberFormat('es-CL').format(amount);
    return `${currency || 'CLP'} ${formatted}`;
  };

  if (!cordada) return null;

  const hasTeam = members && members.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mountain className="w-5 h-5" />
            {cordada.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          {cordada.description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Descripción</h4>
              <p className="text-sm">{cordada.description}</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {cordada.budget_amount && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span>{formatBudget(cordada.budget_amount, cordada.budget_currency)}</span>
              </div>
            )}
            {cordada.estimated_duration_weeks && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{cordada.estimated_duration_weeks} semanas</span>
              </div>
            )}
          </div>

          {/* Terrain */}
          {cordada.terrain && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Terreno</h4>
              <p className="text-sm">{cordada.terrain}</p>
            </div>
          )}

          {/* Risks */}
          {cordada.risks && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Riesgos
              </h4>
              <p className="text-sm">{cordada.risks}</p>
            </div>
          )}

          {/* Objectives */}
          {cordada.objectives && cordada.objectives.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Target className="w-4 h-4" />
                Objetivos
              </h4>
              <ul className="space-y-1">
                {cordada.objectives.map((obj, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Required Expertise */}
          {cordada.required_expertise && cordada.required_expertise.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Especialidades Requeridas</h4>
              <div className="flex flex-wrap gap-2">
                {cordada.required_expertise.map((exp, idx) => (
                  <Badge key={idx} variant="secondary">{exp}</Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Team Section */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Users className="w-4 h-4" />
              Equipo Propuesto
            </h4>

            {cordada.status === 'draft' ? (
              <p className="text-sm text-muted-foreground">
                Publica el desafío para que el administrador pueda proponer un equipo.
              </p>
            ) : membersLoading ? (
              <p className="text-sm text-muted-foreground">Cargando equipo...</p>
            ) : !hasTeam ? (
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    El administrador aún no ha propuesto un equipo para este desafío.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {member.consultant ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="font-medium text-primary hover:underline cursor-pointer">
                                    {member.consultant.full_name}
                                  </button>
                                </PopoverTrigger>
                                <ConsultantProfilePopover consultant={member.consultant} />
                              </Popover>
                            ) : (
                              <span className="font-medium">Consultor asignado</span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {roleLabels[member.role]}
                            </Badge>
                            {member.client_status && (
                              <Badge variant={statusBadge[member.client_status]?.variant || 'secondary'}>
                                {statusBadge[member.client_status]?.label || member.client_status}
                              </Badge>
                            )}
                          </div>
                          
                          <Textarea
                            placeholder="Escribe tu feedback sobre este miembro..."
                            className="mt-2 text-sm"
                            value={feedbackMap[member.id] ?? member.client_feedback ?? ''}
                            onChange={(e) => setFeedbackMap(prev => ({ ...prev, [member.id]: e.target.value }))}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant={member.client_status === 'aprobado' ? 'default' : 'outline'}
                            className="w-20"
                            onClick={() => updateMemberMutation.mutate({
                              memberId: member.id,
                              status: 'aprobado',
                              feedback: feedbackMap[member.id],
                            })}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Sí
                          </Button>
                          <Button
                            size="sm"
                            variant={member.client_status === 'rechazado' ? 'destructive' : 'outline'}
                            className="w-20"
                            onClick={() => updateMemberMutation.mutate({
                              memberId: member.id,
                              status: 'rechazado',
                              feedback: feedbackMap[member.id],
                            })}
                          >
                            <X className="w-4 h-4 mr-1" />
                            No
                          </Button>
                          <Button
                            size="sm"
                            variant={member.client_status === 'pendiente' ? 'secondary' : 'ghost'}
                            className="w-20"
                            onClick={() => updateMemberMutation.mutate({
                              memberId: member.id,
                              status: 'pendiente',
                              feedback: feedbackMap[member.id],
                            })}
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            ?
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
