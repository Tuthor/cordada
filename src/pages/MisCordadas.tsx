import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mountain } from "lucide-react";
import { getCordadaStatusInfo, getCordadaRoleInfo } from "@/data/cordadaData";
import type { Cordada, CordadaRole } from "@/types/cordada";

type Row = Cordada & { my_role: CordadaRole };

export default function MisCordadas() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: app } = await supabase
        .from("consultant_applications")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!app) {
        setRows([]);
        setLoading(false);
        return;
      }

      const { data: members } = await supabase
        .from("cordada_members")
        .select("role, cordada:cordadas(*)")
        .eq("consultant_id", app.id);

      const list: Row[] = (members || [])
        .filter((m: any) => m.cordada)
        .map((m: any) => ({ ...(m.cordada as Cordada), my_role: m.role as CordadaRole }));
      setRows(list);
      setLoading(false);
    })();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mountain className="h-7 w-7 text-primary" />
            Mis Cordadas
          </h1>
          <p className="text-muted-foreground mt-1">
            Desafíos donde formas parte del equipo.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aún no formas parte de ninguna cordada.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rows.map((c) => {
              const status = getCordadaStatusInfo(c.status);
              const role = getCordadaRoleInfo(c.my_role);
              return (
                <Link key={c.id} to={`/mis-cordadas/${c.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <CardTitle>{c.title}</CardTitle>
                          <CardDescription>
                            {c.client_company || c.client_name || "Cliente"}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{role.name}</Badge>
                          <Badge className={status.color}>{status.name}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
