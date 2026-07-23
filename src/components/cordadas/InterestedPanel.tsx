import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, Users, User } from "lucide-react";
import { cordadaRoles } from "@/data/cordadaData";
import type { CordadaRole } from "@/types/cordada";

interface Props {
  cordadaId: string;
  // Roles already filled — used to hint the select
  filledRoles?: CordadaRole[];
}

interface InterestRow {
  id: string;
  consultant_id: string;
  cover_letter: string;
  scope: string | null;
  timeline: string | null;
  status: string;
  created_at: string;
  full_name?: string;
  bio?: string | null;
}

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  submitted: { label: "Interesado", variant: "secondary" },
  accepted: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
};

export function InterestedPanel({ cordadaId, filledRoles = [] }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [approveOpen, setApproveOpen] = useState<string | null>(null);
  const [roleForApprove, setRoleForApprove] = useState<CordadaRole | "">("");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["cordada-interested", cordadaId],
    queryFn: async () => {
      const { data: proposals, error } = await supabase
        .from("proposals")
        .select("id, consultant_id, cover_letter, scope, timeline, status, created_at")
        .eq("cordada_id", cordadaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!proposals?.length) return [] as InterestRow[];

      const { data: profiles } = await supabase.rpc("get_cordada_interest_profiles", {
        _cordada_id: cordadaId,
      });
      const byUser = new Map<string, { full_name: string | null; bio: string | null; expertise: string[] | null }>();
      (profiles ?? []).forEach((p: any) => {
        byUser.set(p.consultant_user_id, { full_name: p.full_name, bio: p.bio, expertise: p.expertise });
      });

      return proposals.map((p) => {
        const info = byUser.get(p.consultant_id);
        return {
          ...p,
          full_name: info?.full_name || "Consultor",
          bio: info?.bio || null,
        };
      }) as InterestRow[];
    },
    enabled: !!cordadaId,
  });

  const rejectMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const { error } = await supabase
        .from("proposals")
        .update({ status: "rejected" })
        .eq("id", proposalId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cordada-interested", cordadaId] });
      toast({ title: "Interesado rechazado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ proposalId, role }: { proposalId: string; role: CordadaRole }) => {
      const { error } = await supabase.rpc("approve_cordada_interest", {
        _proposal_id: proposalId,
        _role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cordada-interested", cordadaId] });
      qc.invalidateQueries({ queryKey: ["cordada-members", cordadaId] });
      qc.invalidateQueries({ queryKey: ["cordada-members-client", cordadaId] });
      toast({ title: "Interesado aprobado e incorporado al equipo" });
      setApproveOpen(null);
      setRoleForApprove("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando interesados...</p>;
  }

  if (!rows?.length) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Aún no hay consultores interesados en este desafío.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">{r.full_name}</span>
                    <Badge variant={statusBadge[r.status]?.variant || "secondary"}>
                      {statusBadge[r.status]?.label || r.status}
                    </Badge>
                  </div>
                  {r.bio && <p className="text-xs text-muted-foreground mb-2">{r.bio}</p>}
                  <p className="text-sm whitespace-pre-wrap">{r.cover_letter}</p>
                  {r.scope && (
                    <p className="text-xs text-muted-foreground mt-2"><b>Alcance:</b> {r.scope}</p>
                  )}
                  {r.timeline && (
                    <p className="text-xs text-muted-foreground"><b>Timeline:</b> {r.timeline}</p>
                  )}
                </div>
                {r.status === "submitted" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setApproveOpen(r.id)}>
                      <Check className="w-4 h-4 mr-1" /> Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectMutation.mutate(r.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" /> Rechazar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!approveOpen} onOpenChange={(o) => !o && setApproveOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar interesado</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rol en la cordada</label>
            <Select value={roleForApprove} onValueChange={(v) => setRoleForApprove(v as CordadaRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {cordadaRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id} disabled={filledRoles.includes(r.id)}>
                    {r.name} {filledRoles.includes(r.id) ? "(ocupado)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(null)}>Cancelar</Button>
            <Button
              disabled={!roleForApprove || approveMutation.isPending}
              onClick={() =>
                approveOpen &&
                roleForApprove &&
                approveMutation.mutate({ proposalId: approveOpen, role: roleForApprove as CordadaRole })
              }
            >
              Aprobar e incorporar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
