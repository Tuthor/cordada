import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, UserCheck, Eye, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConsultantRow {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  maturity_level: string | null;
  maturity_score: number | null;
  is_available: boolean;
  created_at: string;
}

export function ConsultantsPanel() {
  const [consultants, setConsultants] = useState<ConsultantRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async () => {
    setIsLoading(true);
    
    // Get consultant user IDs
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "consultant");
    
    if (!roles || roles.length === 0) {
      setConsultants([]);
      setIsLoading(false);
      return;
    }

    const consultantIds = roles.map(r => r.user_id);

    // Get profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, created_at")
      .in("user_id", consultantIds);

    // Get consultant profiles
    const { data: consultantProfiles } = await supabase
      .from("consultant_profiles")
      .select("id, user_id, maturity_level, maturity_score, is_available")
      .in("user_id", consultantIds);

    // Merge data
    const mergedData: ConsultantRow[] = (profiles || []).map(profile => {
      const consultantProfile = consultantProfiles?.find(cp => cp.user_id === profile.user_id);
      return {
        id: consultantProfile?.id || profile.user_id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        maturity_level: consultantProfile?.maturity_level || null,
        maturity_score: consultantProfile?.maturity_score || null,
        is_available: consultantProfile?.is_available ?? true,
        created_at: profile.created_at,
      };
    });

    setConsultants(mergedData);
    setIsLoading(false);
  };

  const getMaturityBadgeVariant = (level: string | null) => {
    switch (level) {
      case 'Guía':
        return 'default';
      case 'Alta Montaña':
        return 'secondary';
      case 'Tramo de Ascenso':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl">Consultores Activos</CardTitle>
          <CardDescription>
            {consultants.length} consultor{consultants.length !== 1 ? "es" : ""} en la plataforma
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchConsultants}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : consultants.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay consultores registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nivel de Madurez</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Alertas</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultants.map((consultant) => (
                  <TableRow key={consultant.id}>
                    <TableCell className="font-medium">{consultant.full_name}</TableCell>
                    <TableCell>{consultant.email}</TableCell>
                    <TableCell>
                      {consultant.maturity_level ? (
                        <Badge variant={getMaturityBadgeVariant(consultant.maturity_level)}>
                          {consultant.maturity_level}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin evaluar</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {consultant.maturity_score !== null ? `${consultant.maturity_score}%` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={consultant.is_available ? "default" : "secondary"}>
                        {consultant.is_available ? "Disponible" : "No disponible"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {/* Placeholder for risk alerts */}
                      <span className="text-muted-foreground text-sm">-</span>
                    </TableCell>
                    <TableCell>
                      {new Date(consultant.created_at).toLocaleDateString("es-CL")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
