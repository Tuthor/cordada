import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mountain, Users, Calendar, CheckCircle2 } from "lucide-react";
import { getCordadaStatusInfo, getCordadaRoleInfo, getRitualTypeInfo } from "@/data/cordadaData";
import type { Cordada, CordadaMember, CordadaRitual, CordadaRole } from "@/types/cordada";

export default function MisCordadaDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [cordada, setCordada] = useState<Cordada | null>(null);
  const [myRole, setMyRole] = useState<CordadaRole | null>(null);
  const [members, setMembers] = useState<CordadaMember[]>([]);
  const [rituals, setRituals] = useState<CordadaRitual[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      setLoading(true);
      const [{ data: cord }, { data: appRows }, { data: rits }] = await Promise.all([
        supabase.from("cordadas").select("*").eq("id", id).maybeSingle(),
        supabase.rpc("get_my_consultant_application"),
        supabase.from("cordada_rituals").select("*").eq("cordada_id", id).order("scheduled_date", { ascending: true }),
      ]);

      setCordada(cord as Cordada | null);
      setRituals((rits || []) as CordadaRitual[]);

      const { data: mems } = await supabase
        .from("cordada_members")
        .select("*")
        .eq("cordada_id", id);
      setMembers((mems || []) as CordadaMember[]);

      const app = Array.isArray(appRows) ? appRows[0] : null;
      if (app?.id && mems) {
        const mine = mems.find((m: any) => m.consultant_id === app.id);
        setMyRole((mine?.role as CordadaRole) ?? null);
      }
      setLoading(false);
    })();
  }, [id, user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!cordada) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Cordada no encontrada o sin acceso.
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const status = getCordadaStatusInfo(cordada.status);
  const myRoleInfo = myRole ? getCordadaRoleInfo(myRole) : null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/mis-cordadas">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mountain className="h-6 w-6 text-primary" />
                  {cordada.title}
                </CardTitle>
                <CardDescription>
                  {cordada.client_company || cordada.client_name || "Cliente"}
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                {myRoleInfo && <Badge variant="outline">Mi rol: {myRoleInfo.name}</Badge>}
                <Badge className={status.color}>{status.name}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {cordada.description && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Descripción</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{cordada.description}</p>
              </div>
            )}
            {cordada.terrain && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Terreno</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{cordada.terrain}</p>
              </div>
            )}
            {cordada.objectives && cordada.objectives.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Objetivos</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {cordada.objectives.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}
            {cordada.estimated_duration_weeks && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Duración estimada: {cordada.estimated_duration_weeks} semanas
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" /> Equipo ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {members.map((m) => {
                const r = getCordadaRoleInfo(m.role);
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-md border">
                    <div>
                      <div className="font-medium text-sm">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.description}</div>
                    </div>
                    {m.is_confirmed && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Confirmado
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rituales</CardTitle>
          </CardHeader>
          <CardContent>
            {rituals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay rituales programados.</p>
            ) : (
              <div className="grid gap-3">
                {rituals.map((r) => {
                  const info = getRitualTypeInfo(r.ritual_type);
                  return (
                    <div key={r.id} className="p-3 rounded-md border">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="font-medium text-sm">{info.name}: {r.title}</div>
                        {r.is_completed ? (
                          <Badge className="bg-green-100 text-green-800">Completado</Badge>
                        ) : (
                          <Badge variant="outline">Pendiente</Badge>
                        )}
                      </div>
                      {r.description && (
                        <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
