import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Compass, Mountain, Calendar, DollarSign, Check } from "lucide-react";
import type { Cordada, CordadaOpenFilters } from "@/types/cordada";

type OpenCordada = Cordada & { open_filters: CordadaOpenFilters | null };

export default function CordadasAbiertas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [applyFor, setApplyFor] = useState<OpenCordada | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [scope, setScope] = useState("");
  const [timeline, setTimeline] = useState("");

  const { data: cordadas, isLoading } = useQuery({
    queryKey: ["open-cordadas"],
    queryFn: async () => {
      // RLS de Fase B filtra automáticamente por match
      const { data, error } = await supabase
        .from("cordadas")
        .select("*")
        .eq("visibility_mode", "open_filtered")
        .eq("status", "convocatoria")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as OpenCordada[];
    },
    enabled: !!user,
  });

  const { data: myInterests } = useQuery({
    queryKey: ["my-cordada-interests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("proposals")
        .select("id, cordada_id, status")
        .eq("consultant_id", user.id)
        .not("cordada_id", "is", null);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!user || !applyFor) throw new Error("Sin sesión");
      const { error } = await supabase.from("proposals").insert({
        cordada_id: applyFor.id,
        consultant_id: user.id,
        status: "submitted",
        cover_letter: coverLetter,
        scope: scope || null,
        timeline: timeline || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-cordada-interests", user?.id] });
      toast({ title: "Interés manifestado", description: "El cliente podrá revisar tu postulación." });
      setApplyFor(null);
      setCoverLetter("");
      setScope("");
      setTimeline("");
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const withdrawMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const { error } = await supabase.from("proposals").delete().eq("id", proposalId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-cordada-interests", user?.id] });
      toast({ title: "Interés retirado" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const interestByCordada = new Map(
    (myInterests || []).map((i: any) => [i.cordada_id as string, i])
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Compass className="h-7 w-7 text-primary" />
            Cordadas abiertas
          </h1>
          <p className="text-muted-foreground mt-1">
            Desafíos publicados en modo abierto que calzan con tu perfil.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : !cordadas?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay cordadas abiertas que calcen con tu perfil por ahora.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {cordadas.map((c) => {
              const mine = interestByCordada.get(c.id) as { id: string; status: string } | undefined;
              return (
                <Card key={c.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Mountain className="w-5 h-5 text-primary" />
                          {c.title}
                        </CardTitle>
                        <CardDescription>
                          {c.client_company || c.client_name || "Cliente"}
                        </CardDescription>
                      </div>
                      {mine && (
                        <Badge variant={mine.status === "accepted" ? "default" : mine.status === "rejected" ? "destructive" : "secondary"}>
                          {mine.status === "submitted" && "Interés manifestado"}
                          {mine.status === "accepted" && "Aprobado"}
                          {mine.status === "rejected" && "Rechazado"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {c.description && <p className="text-sm">{c.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {c.estimated_duration_weeks && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {c.estimated_duration_weeks} semanas
                        </span>
                      )}
                      {c.budget_amount && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {c.budget_currency || "CLP"} {c.budget_amount.toLocaleString("es-CL")}
                        </span>
                      )}
                    </div>
                    {c.open_filters?.expertise_tags?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {c.open_filters.expertise_tags.map((t) => (
                          <Badge key={t} variant="outline">{t}</Badge>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex gap-2 pt-2">
                      {!mine && (
                        <Button size="sm" onClick={() => setApplyFor(c)}>
                          Manifestar interés
                        </Button>
                      )}
                      {mine?.status === "submitted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => withdrawMutation.mutate(mine.id)}
                        >
                          Retirar interés
                        </Button>
                      )}
                      {mine?.status === "accepted" && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3" /> Incorporado al equipo
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!applyFor} onOpenChange={(o) => !o && setApplyFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manifestar interés — {applyFor?.title}</DialogTitle>
            <DialogDescription>
              Cuenta por qué encajas y qué puedes aportar. El cliente lo revisará.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Carta de presentación *</label>
              <Textarea
                rows={5}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Mínimo 50 caracteres..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Alcance propuesto (opcional)</label>
              <Textarea rows={2} value={scope} onChange={(e) => setScope(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Timeline sugerido (opcional)</label>
              <Textarea rows={2} value={timeline} onChange={(e) => setTimeline(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyFor(null)}>Cancelar</Button>
            <Button
              disabled={coverLetter.trim().length < 50 || applyMutation.isPending}
              onClick={() => applyMutation.mutate()}
            >
              Enviar interés
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
