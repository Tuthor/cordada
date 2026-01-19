import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp,
  BarChart3,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  GraduationCap
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PartnerCourseDialog } from '@/components/partner/PartnerCourseDialog';
import { PartnerCourseStats } from '@/components/partner/PartnerCourseStats';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PartnerCourse {
  id: string;
  partner_id: string;
  title: string;
  description: string | null;
  course_type: 'course' | 'workshop';
  price: number;
  currency: string;
  duration_hours: number | null;
  max_participants: number | null;
  is_published: boolean;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

const PartnerDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<PartnerCourse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<PartnerCourse | null>(null);

  // Fetch partner courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['partner-courses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_courses')
        .select('*')
        .eq('partner_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PartnerCourse[];
    },
    enabled: !!user?.id,
  });

  // Fetch enrollments for stats
  const { data: enrollments = [] } = useQuery({
    queryKey: ['partner-enrollments', user?.id],
    queryFn: async () => {
      const courseIds = courses.map(c => c.id);
      if (courseIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('partner_course_enrollments')
        .select('*')
        .in('course_id', courseIds);
      
      if (error) throw error;
      return data;
    },
    enabled: courses.length > 0,
  });

  // Toggle publish mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('partner_courses')
        .update({ is_published })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-courses'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar el estado');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('partner_courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-courses'] });
      toast.success('Curso eliminado');
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    },
    onError: () => {
      toast.error('Error al eliminar el curso');
    },
  });

  // Calculate stats
  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.is_published).length;
  const totalEnrollments = enrollments.length;
  const totalRevenue = enrollments
    .filter(e => e.payment_status === 'paid')
    .reduce((sum, e) => sum + (Number(e.payment_amount) || 0), 0);

  const handleEdit = (course: PartnerCourse) => {
    setEditingCourse(course);
    setDialogOpen(true);
  };

  const handleDelete = (course: PartnerCourse) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCourse(null);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Panel de Partner
            </h1>
            <p className="text-muted-foreground">
              Administra tus cursos y talleres para la comunidad
            </p>
          </div>
          <Button variant="gold" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Curso/Taller
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cursos
              </CardTitle>
              <BookOpen className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                {publishedCourses} publicados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inscripciones
              </CardTitle>
              <Users className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEnrollments}</div>
              <p className="text-xs text-muted-foreground">
                Total de participantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos Totales
              </CardTitle>
              <DollarSign className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(totalRevenue, 'CLP')}</div>
              <p className="text-xs text-muted-foreground">
                Pagos confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasa Conversión
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalEnrollments > 0 
                  ? `${Math.round((enrollments.filter(e => e.payment_status === 'paid').length / totalEnrollments) * 100)}%`
                  : '0%'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Inscripciones pagadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Courses and Stats */}
        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Mis Cursos
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando cursos...
              </div>
            ) : courses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tienes cursos aún</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea tu primer curso o taller para empezar
                  </p>
                  <Button variant="gold" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Curso
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => {
                  const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
                  return (
                    <Card key={course.id} className="relative overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={course.course_type === 'course' ? 'default' : 'secondary'}>
                                {course.course_type === 'course' ? 'Curso' : 'Taller'}
                              </Badge>
                              <Badge variant={course.is_published ? 'default' : 'outline'}>
                                {course.is_published ? 'Publicado' : 'Borrador'}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg">{course.title}</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {course.description || 'Sin descripción'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Precio</span>
                          <span className="font-semibold text-gold">
                            {formatPrice(Number(course.price), course.currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Inscripciones</span>
                          <span className="font-medium">{courseEnrollments.length}</span>
                        </div>
                        {course.duration_hours && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Duración</span>
                            <span>{course.duration_hours} horas</span>
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => togglePublishMutation.mutate({ 
                              id: course.id, 
                              is_published: !course.is_published 
                            })}
                          >
                            {course.is_published ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-1" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-1" />
                                Publicar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(course)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(course)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats">
            <PartnerCourseStats courses={courses} enrollments={enrollments} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Course Dialog */}
      <PartnerCourseDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        course={editingCourse}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el curso "{courseToDelete?.title}" 
              y todas las inscripciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => courseToDelete && deleteMutation.mutate(courseToDelete.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default PartnerDashboard;