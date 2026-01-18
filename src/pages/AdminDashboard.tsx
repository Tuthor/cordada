import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  LogOut, 
  Download, 
  Trash2, 
  Loader2, 
  Users, 
  RefreshCw,
  AlertTriangle,
  UserCheck,
  ClipboardList
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Enrollment {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  linkedin: string | null;
  expertise: string | null;
  years_experience: string | null;
  motivation: string | null;
  maturity_level: string | null;
  overall_score: number | null;
  status: string | null;
  created_at: string;
}

interface RegisteredUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  role: string | null;
}

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Administrador', variant: 'default' },
  client: { label: 'Cliente', variant: 'secondary' },
  consultant: { label: 'Consultor', variant: 'outline' },
  consulting_firm: { label: 'Empresa Consultora', variant: 'outline' },
};

const AdminDashboard = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("enrollments");
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/admin/login");
        } else {
          setTimeout(() => {
            checkAdminAccess(session.user.id);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/admin/login");
      } else {
        checkAdminAccess(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSessionExpiration = () => {
    const loginTimestamp = localStorage.getItem("admin_login_timestamp");
    if (!loginTimestamp) {
      return true; // No timestamp means session should be expired
    }
    
    const loginTime = parseInt(loginTimestamp, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    return (now - loginTime) > twentyFourHours;
  };

  const handleSessionExpired = async () => {
    localStorage.removeItem("admin_login_timestamp");
    await supabase.auth.signOut();
    toast({
      title: "Sesión expirada",
      description: "Tu sesión ha expirado después de 24 horas. Por favor inicia sesión nuevamente.",
      variant: "destructive",
    });
    navigate("/admin/login");
  };

  const checkAdminAccess = async (userId: string) => {
    // Check if session has expired (24 hours)
    if (checkSessionExpiration()) {
      await handleSessionExpired();
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      navigate("/admin/login");
      return;
    }

    setCurrentAdminId(userId);
    setIsCheckingAuth(false);
    fetchEnrollments();
    fetchRegisteredUsers();
  };

  const fetchEnrollments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("enrollments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las inscripciones",
        variant: "destructive",
      });
    } else {
      setEnrollments(data || []);
    }
    setIsLoading(false);
  };

  const fetchRegisteredUsers = async () => {
    setIsLoadingUsers(true);
    
    // First get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
      setIsLoadingUsers(false);
      return;
    }

    // Then get all user roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    // Merge profiles with roles
    const usersWithRoles: RegisteredUser[] = (profiles || []).map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.user_id);
      return {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        created_at: profile.created_at,
        role: userRole?.role || null,
      };
    });

    setRegisteredUsers(usersWithRoles);
    setIsLoadingUsers(false);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Eliminado",
        description: "El registro fue eliminado correctamente",
      });
      setEnrollments(enrollments.filter(e => e.id !== id));
    }
    setIsDeleting(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentAdminId) {
      toast({
        title: "Error",
        description: "No puedes eliminar tu propia cuenta de administrador",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingUser(userId);
    
    // Delete from user_roles first (if exists)
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // Delete from profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    if (profileError) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Eliminado",
        description: "El usuario fue eliminado correctamente",
      });
      setRegisteredUsers(registeredUsers.filter(u => u.user_id !== userId));
    }
    setIsDeletingUser(null);
  };

  const handleExportCSV = () => {
    if (enrollments.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay inscripciones para exportar",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "ID",
      "Nombre Completo",
      "Email",
      "Teléfono",
      "Empresa",
      "LinkedIn",
      "Especialidad",
      "Años Experiencia",
      "Motivación",
      "Nivel Madurez",
      "Puntuación",
      "Estado",
      "Fecha Creación"
    ];

    const csvContent = [
      headers.join(","),
      ...enrollments.map(e => [
        e.id,
        `"${e.full_name || ""}"`,
        `"${e.email || ""}"`,
        `"${e.phone || ""}"`,
        `"${e.company || ""}"`,
        `"${e.linkedin || ""}"`,
        `"${e.expertise || ""}"`,
        `"${e.years_experience || ""}"`,
        `"${(e.motivation || "").replace(/"/g, '""')}"`,
        `"${e.maturity_level || ""}"`,
        e.overall_score || "",
        e.status || "",
        new Date(e.created_at).toLocaleString("es-CL")
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inscripciones_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportado",
      description: `Se exportaron ${enrollments.length} registros`,
    });
  };

  const handleLogout = async () => {
    localStorage.removeItem("admin_login_timestamp");
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const getLevelBadgeVariant = (level: string | null) => {
    switch (level) {
      case "Consultor Experto":
        return "default";
      case "Consultor Avanzado":
        return "secondary";
      case "Profesional Emergente":
        return "outline";
      default:
        return "outline";
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-gold rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Panel de Administración</h1>
              <p className="text-sm text-primary-foreground/70">Gestión de Usuarios y Postulantes</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="enrollments" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Postulantes
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
          </TabsList>

          {/* Enrollments Tab */}
          <TabsContent value="enrollments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-xl">Postulantes</CardTitle>
                  <CardDescription>
                    {enrollments.length} registro{enrollments.length !== 1 ? "s" : ""} en total
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchEnrollments}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Actualizar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleExportCSV}
                    className="bg-gradient-gold text-accent-foreground hover:opacity-90"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay postulantes registrados</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Especialidad</TableHead>
                          <TableHead>Nivel</TableHead>
                          <TableHead className="text-center">Puntuación</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">
                              {enrollment.full_name}
                            </TableCell>
                            <TableCell>{enrollment.email}</TableCell>
                            <TableCell>{enrollment.company || "-"}</TableCell>
                            <TableCell>{enrollment.expertise || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={getLevelBadgeVariant(enrollment.maturity_level)}>
                                {enrollment.maturity_level || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {enrollment.overall_score !== null ? `${enrollment.overall_score}%` : "-"}
                            </TableCell>
                            <TableCell>
                              {new Date(enrollment.created_at).toLocaleDateString("es-CL")}
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={isDeleting === enrollment.id}
                                  >
                                    {isDeleting === enrollment.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="w-5 h-5 text-destructive" />
                                      Confirmar eliminación
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Estás seguro de eliminar la inscripción de{" "}
                                      <strong>{enrollment.full_name}</strong>? Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(enrollment.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registered Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-xl">Usuarios Registrados</CardTitle>
                  <CardDescription>
                    {registeredUsers.length} usuario{registeredUsers.length !== 1 ? "s" : ""} en la plataforma
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRegisteredUsers}
                  disabled={isLoadingUsers}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingUsers ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : registeredUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay usuarios registrados</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Fecha Registro</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registeredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.full_name}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.phone || "-"}</TableCell>
                            <TableCell>
                              {user.role ? (
                                <Badge variant={roleLabels[user.role]?.variant || 'outline'}>
                                  {roleLabels[user.role]?.label || user.role}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">Sin rol</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString("es-CL")}
                            </TableCell>
                            <TableCell className="text-right">
                              {user.user_id === currentAdminId ? (
                                <span className="text-xs text-muted-foreground">Tu cuenta</span>
                              ) : (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      disabled={isDeletingUser === user.user_id}
                                    >
                                      {isDeletingUser === user.user_id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-destructive" />
                                        Confirmar eliminación
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Estás seguro de eliminar al usuario{" "}
                                        <strong>{user.full_name || user.email}</strong>? Esta acción eliminará su perfil y roles.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user.user_id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
