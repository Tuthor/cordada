import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CordadaRitual, CordadaStatus, RitualType } from "@/types/cordada";
import { ritualTypes, getRitualTypeInfo } from "@/data/cordadaData";
import { useToast } from "@/hooks/use-toast";
import { 
  PlayCircle, 
  CheckCircle2, 
  Trophy, 
  Circle,
  Check,
  Calendar,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ritualIcons: Record<RitualType, typeof PlayCircle> = {
  brief_cordada: PlayCircle,
  chequeo_tramo: CheckCircle2,
  cierre_cumbre: Trophy,
};

interface RitualsTimelineProps {
  cordadaId: string;
  rituals: CordadaRitual[];
  cordadaStatus: CordadaStatus;
  onUpdate: () => void;
}

export function RitualsTimeline({ 
  cordadaId, 
  rituals, 
  cordadaStatus,
  onUpdate 
}: RitualsTimelineProps) {
  const { toast } = useToast();
  const [showRitualDialog, setShowRitualDialog] = useState(false);
  const [selectedRitualType, setSelectedRitualType] = useState<RitualType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [scheduledDate, setScheduledDate] = useState("");
  const [outcomes, setOutcomes] = useState("");

  const getRitualForType = (type: RitualType) => 
    rituals.find(r => r.ritual_type === type);

  const createOrUpdateRitual = async (complete: boolean = false) => {
    if (!selectedRitualType) return;
    
    setIsLoading(true);
    try {
      const existingRitual = getRitualForType(selectedRitualType);
      const ritualInfo = getRitualTypeInfo(selectedRitualType);
      const { data: user } = await supabase.auth.getUser();

      if (existingRitual) {
        // Update existing
        const { error } = await supabase
          .from('cordada_rituals')
          .update({
            scheduled_date: scheduledDate || null,
            outcomes: outcomes || null,
            is_completed: complete,
            completed_date: complete ? new Date().toISOString() : null,
          })
          .eq('id', existingRitual.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('cordada_rituals')
          .insert({
            cordada_id: cordadaId,
            ritual_type: selectedRitualType,
            title: ritualInfo.name,
            description: ritualInfo.description,
            scheduled_date: scheduledDate || null,
            outcomes: outcomes || null,
            is_completed: complete,
            completed_date: complete ? new Date().toISOString() : null,
            created_by: user.user?.id,
          });

        if (error) throw error;
      }

      toast({
        title: complete ? "Ritual completado" : "Ritual actualizado",
        description: `${ritualInfo.name} ha sido ${complete ? 'marcado como completado' : 'actualizado'}`,
      });
      
      setShowRitualDialog(false);
      setScheduledDate("");
      setOutcomes("");
      setSelectedRitualType(null);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openRitualDialog = (type: RitualType) => {
    const existing = getRitualForType(type);
    setSelectedRitualType(type);
    setScheduledDate(existing?.scheduled_date || "");
    setOutcomes(existing?.outcomes || "");
    setShowRitualDialog(true);
  };

  const canStartRitual = (type: RitualType): boolean => {
    if (cordadaStatus === 'draft') return false;
    
    const ritualInfo = getRitualTypeInfo(type);
    if (ritualInfo.step === 1) return true;
    
    // Previous ritual must be completed
    const previousType = ritualTypes.find(r => r.step === ritualInfo.step - 1);
    if (!previousType) return true;
    
    const previousRitual = getRitualForType(previousType.id);
    return previousRitual?.is_completed || false;
  };

  return (
    <div className="space-y-6">
      {cordadaStatus === 'draft' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-800">
              Los rituales estarán disponibles cuando la cordada sea publicada
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        
        {ritualTypes.map((ritualType, index) => {
          const ritual = getRitualForType(ritualType.id);
          const RitualIcon = ritualIcons[ritualType.id];
          const canStart = canStartRitual(ritualType.id);
          const isCompleted = ritual?.is_completed;
          
          return (
            <div key={ritualType.id} className="relative pl-14 pb-8 last:pb-0">
              {/* Timeline dot */}
              <div className={`
                absolute left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${isCompleted 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : ritual 
                    ? 'bg-secondary border-secondary text-secondary-foreground'
                    : 'bg-background border-muted-foreground'
                }
              `}>
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className="text-xs font-bold">{ritualType.step}</span>
                )}
              </div>

              <Card className={!canStart ? 'opacity-50' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <RitualIcon className="w-5 h-5" />
                      {ritualType.name}
                    </span>
                    {isCompleted && (
                      <Badge variant="default">
                        Completado
                      </Badge>
                    )}
                    {ritual && !isCompleted && (
                      <Badge variant="secondary">Programado</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {ritualType.description}
                  </p>
                  
                  {ritual?.scheduled_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(ritual.scheduled_date), "dd 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                  )}
                  
                  {ritual?.outcomes && (
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="w-4 h-4 mt-0.5" />
                      <span className="line-clamp-2">{ritual.outcomes}</span>
                    </div>
                  )}

                  {ritual?.completed_date && (
                    <p className="text-xs text-muted-foreground">
                      Completado el {format(new Date(ritual.completed_date), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  )}

                  {canStart && !isCompleted && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openRitualDialog(ritualType.id)}
                    >
                      {ritual ? 'Editar / Completar' : 'Programar'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Ritual Dialog */}
      <Dialog open={showRitualDialog} onOpenChange={setShowRitualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRitualType && getRitualTypeInfo(selectedRitualType).name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Programada</label>
              <Input 
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resultados / Hallazgos</label>
              <Textarea 
                placeholder="Documenta los resultados, acuerdos o hallazgos del ritual..."
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRitualDialog(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="outline"
                onClick={() => createOrUpdateRitual(false)}
                disabled={isLoading}
              >
                Guardar
              </Button>
              <Button 
                onClick={() => createOrUpdateRitual(true)}
                disabled={isLoading}
              >
                <Check className="w-4 h-4 mr-1" />
                Completar Ritual
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
