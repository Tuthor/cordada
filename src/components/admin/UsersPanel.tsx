import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, RefreshCw, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type RoleFilter = "all" | "client" | "partner" | "consultant" | "consulting_firm" | "admin";

interface UserRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  client: "Cliente",
  partner: "Partner",
  consultant: "Consultor",
  consulting_firm: "Empresa Consultora",
  admin: "Administrador",
};

export function UsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [confirmUser, setConfirmUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const roleMap = new Map<string, string>();
    (roles || []).forEach((r: any) => roleMap.set(r.user_id, r.role));
    const rows: UserRow[] = (profiles || []).map((p: any) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      email: p.email,
      created_at: p.created_at,
      role: roleMap.get(p.user_id) ?? null,
    }));
    setUsers(rows);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!confirmUser) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("delete-user", {
      body: { user_id: confirmUser.user_id },
    });
    setDeleting(false);
    if (error || !data?.success) {
      toast({
        title: "Error",
        description: data?.error || error?.message || "No se pudo eliminar",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Usuario eliminado" });
    setConfirmUser(null);
    fetchUsers();
  };

  const filtered = users.filter((u) => filter === "all" || u.role === filter);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">Usuarios</CardTitle>
            <CardDescription>
              {filtered.length} usuario{filtered.length !== 1 ? "s" : ""}
              {filter !== "all" ? ` con rol ${roleLabels[filter]}` : ""}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as RoleFilter)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="client">Clientes</SelectItem>
                <SelectItem value="partner">Partners</SelectItem>
                <SelectItem value="consultant">Consultores</SelectItem>
                <SelectItem value="consulting_firm">Empresas Consultoras</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Sin usuarios que coincidan con el filtro</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Registrado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => {
                    const isSelf = u.user_id === currentUser?.id;
                    return (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.email || "—"}</TableCell>
                        <TableCell>
                          {u.role ? (
                            <Badge variant="outline">{roleLabels[u.role] || u.role}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin rol</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString("es-CL")}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmUser(u)}
                            disabled={isSelf}
                            title={isSelf ? "No puedes eliminarte a ti mismo" : "Eliminar usuario"}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmUser} onOpenChange={(o) => !o && setConfirmUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la cuenta de <strong>{confirmUser?.full_name || confirmUser?.email}</strong> y todos sus datos asociados (perfil, rol, membresías, postulaciones). Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
