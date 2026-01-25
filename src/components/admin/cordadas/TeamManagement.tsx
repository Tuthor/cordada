import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CordadaMember, CordadaRole } from "@/types/cordada";
import { cordadaRoles, getCordadaRoleInfo } from "@/data/cordadaData";
import { getArchetypeInfo } from "@/data/orchestrationData";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  Compass,
  Route,
  ShieldCheck,
  Binoculars,
  Backpack,
  BookOpen,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConsultantArchetype } from "@/types/orchestration";
import { 
  calculateCompatibility, 
  rankConsultantsForRole,
  ConsultantForMatching 
} from "@/hooks/useMatchmakingScore";
import { CompatibilityBadge, CompatibilityBar } from "./CompatibilityBadge";

const roleIcons: Record<CordadaRole, typeof Compass> = {
  guia_alta_montana: Compass,
  primer_de_cuerda: Route,
  asegurador: ShieldCheck,
  explorador: Binoculars,
  sherpa: Backpack,
  cronista: BookOpen,
};

interface TeamManagementProps {
  cordadaId: string;
  members: CordadaMember[];
  requiredExpertise: string[];
  onUpdate: () => void;
}

export function TeamManagement({ 
  cordadaId, 
  members, 
  requiredExpertise,
  onUpdate 
}: TeamManagementProps) {
  const { toast } = useToast();
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<CordadaRole | "">("");
  const [isAdding, setIsAdding] = useState(false);
  const [showMatchmaking, setShowMatchmaking] = useState(false);

  // Fetch available consultants (accepted status)
  const { data: availableConsultants } = useQuery({
    queryKey: ['available-consultants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultant_applications')
        .select('id, full_name, email, archetype, maturity_level')
        .eq('status', 'aceptado');
      
      if (error) throw error;
      return data;
    },
  });

  const memberIds = members.map(m => m.consultant_id);
  const filteredConsultants = useMemo(() => 
    availableConsultants?.filter(c => !memberIds.includes(c.id)) || [],
    [availableConsultants, memberIds]
  );

  // Get ranked consultants for a specific role
  const getRankedConsultantsForRole = (role: CordadaRole) => {
    const consultantsForMatching: ConsultantForMatching[] = filteredConsultants.map(c => ({
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      archetype: c.archetype,
      maturity_level: c.maturity_level,
      maturity_score: null, // Not fetched in the query
    }));
    return rankConsultantsForRole(consultantsForMatching, role);
  };

  const addMember = async () => {
    if (!selectedConsultant || !selectedRole) return;
    
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('cordada_members')
        .insert({
          cordada_id: cordadaId,
          consultant_id: selectedConsultant,
          role: selectedRole,
        });

      if (error) throw error;

      toast({
        title: "Miembro agregado",
        description: "El consultor ha sido agregado al equipo",
      });
      
      setSelectedConsultant("");
      setSelectedRole("");
      setShowAddMember(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('cordada_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Miembro removido",
        description: "El consultor ha sido removido del equipo",
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

  const confirmMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('cordada_members')
        .update({ 
          is_confirmed: true,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Miembro confirmado",
        description: "El consultor ha confirmado su participación",
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

  // Get compatibility for assigned member

  // Get compatibility for assigned member
  const getMemberCompatibility = (member: CordadaMember) => {
    if (!member.consultant) return null;
    return calculateCompatibility(
      {
        id: member.consultant_id,
        full_name: member.consultant.full_name,
        email: member.consultant.email,
        archetype: member.consultant.archetype,
        maturity_level: member.consultant.maturity_level,
        maturity_score: null,
      },
      member.role
    );
  };

  return (
    <div className="space-y-6">
      {/* Team Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cordadaRoles.map(role => {
          const member = members.find(m => m.role === role.id);
          const RoleIcon = roleIcons[role.id];
          
          return (
            <Card key={role.id} className={member ? "border-primary/50" : "border-dashed"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <RoleIcon className="w-4 h-4" />
                  {role.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {member ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {member.consultant?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {member.consultant?.full_name}
                          </p>
                          {/* Compatibility badge for assigned member */}
                          {(() => {
                            const compat = getMemberCompatibility(member);
                            return compat && <CompatibilityBadge compatibility={compat} size="sm" />;
                          })()}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.consultant?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {member.consultant?.archetype && (
                        <Badge variant="secondary" className="text-xs">
                          {getArchetypeInfo(member.consultant.archetype as ConsultantArchetype).name}
                        </Badge>
                      )}
                      {member.is_confirmed ? (
                        <Badge variant="default" className="text-xs gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmado
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => confirmMember(member.id)}
                        >
                          Confirmar
                        </Button>
                      )}
                    </div>

                    {/* Client Feedback Section */}
                    {member.client_status && (
                      <div className="mt-2 p-2 rounded-md bg-muted/50 border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Feedback Cliente:</span>
                          {member.client_status === 'aprobado' && (
                            <Badge variant="default" className="text-xs gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              Aprobado
                            </Badge>
                          )}
                          {member.client_status === 'rechazado' && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <ThumbsDown className="w-3 h-3" />
                              Rechazado
                            </Badge>
                          )}
                          {member.client_status === 'pendiente' && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Clock className="w-3 h-3" />
                              Pendiente
                            </Badge>
                          )}
                        </div>
                        {member.client_feedback && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-muted-foreground line-clamp-2 cursor-help flex items-start gap-1">
                                <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                {member.client_feedback}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">{member.client_feedback}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )}

                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => removeMember(member.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Sin asignar
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedRole(role.id);
                        setShowAddMember(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Asignar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Matchmaking Button */}
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => setShowMatchmaking(true)}
        >
          <Sparkles className="w-4 h-4" />
          Sugerir Equipo (Matchmaking)
        </Button>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Miembro al Equipo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as CordadaRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {cordadaRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Consultor</label>
              <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar consultor" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRole && getRankedConsultantsForRole(selectedRole).map(consultant => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      <div className="flex items-center gap-2 w-full">
                        <span className="flex-1 truncate">{consultant.full_name}</span>
                        {consultant.archetype && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {getArchetypeInfo(consultant.archetype as ConsultantArchetype).name}
                          </Badge>
                        )}
                        {consultant.maturity_level && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {consultant.maturity_level}
                          </Badge>
                        )}
                        <CompatibilityBadge compatibility={consultant.compatibility} size="sm" />
                      </div>
                    </SelectItem>
                  ))}
                  {!selectedRole && filteredConsultants?.map(consultant => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      <div className="flex items-center gap-2 w-full">
                        <span className="flex-1 truncate">{consultant.full_name}</span>
                        {consultant.archetype && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {getArchetypeInfo(consultant.archetype as ConsultantArchetype).name}
                          </Badge>
                        )}
                        {consultant.maturity_level && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {consultant.maturity_level}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddMember(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={addMember} 
                disabled={!selectedConsultant || !selectedRole || isAdding}
              >
                {isAdding ? "Agregando..." : "Agregar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Matchmaking Dialog */}
      <Dialog open={showMatchmaking} onOpenChange={setShowMatchmaking}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Sugerencias de Equipo (Matchmaking)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Basado en los arquetipos recomendados para cada rol, estos son los consultores sugeridos:
            </p>
            {cordadaRoles.map(role => {
              const rankedConsultants = getRankedConsultantsForRole(role.id);
              const isAssigned = members.some(m => m.role === role.id);
              
              return (
                <Card key={role.id} className={isAssigned ? "opacity-50" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span>{role.name}</span>
                      {isAssigned && <Badge variant="secondary">Ya asignado</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rankedConsultants.length > 0 ? (
                      <div className="space-y-2">
                        {rankedConsultants.slice(0, 4).map(c => (
                          <div 
                            key={c.id}
                            className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                              isAssigned 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:bg-accent hover:border-primary'
                            }`}
                            onClick={() => {
                              if (!isAssigned) {
                                setSelectedConsultant(c.id);
                                setSelectedRole(role.id);
                                setShowMatchmaking(false);
                                setShowAddMember(true);
                              }
                            }}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {c.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{c.full_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <CompatibilityBar score={c.compatibility.score} className="flex-1 max-w-[100px]" />
                                {c.archetype && (
                                  <Badge variant="outline" className="text-xs">
                                    {getArchetypeInfo(c.archetype as ConsultantArchetype).name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <CompatibilityBadge compatibility={c.compatibility} size="md" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No hay consultores disponibles
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      Arquetipos recomendados: {role.recommendedArchetypes.map(a => 
                        getArchetypeInfo(a as ConsultantArchetype).name
                      ).join(', ')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
