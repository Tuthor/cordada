import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';

const projectSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  requirements: z.string().optional(),
  budget_min: z.coerce.number().min(0).optional().or(z.literal('')),
  budget_max: z.coerce.number().min(0).optional().or(z.literal('')),
  duration_weeks: z.coerce.number().min(1).max(52).optional().or(z.literal('')),
  expertise_needed: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const ProjectEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      requirements: '',
      expertise_needed: '',
    },
  });

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el desafío',
        variant: 'destructive',
      });
      navigate('/projects');
      return;
    }

    // Check ownership
    if (data.client_id !== user?.id) {
      toast({
        title: 'Acceso denegado',
        description: 'No tienes permiso para editar este desafío',
        variant: 'destructive',
      });
      navigate('/projects');
      return;
    }

    form.reset({
      title: data.title,
      description: data.description,
      requirements: data.requirements || '',
      budget_min: data.budget_min || '',
      budget_max: data.budget_max || '',
      duration_weeks: data.duration_weeks || '',
      expertise_needed: data.expertise_needed?.join(', ') || '',
    });

    setLoading(false);
  };

  const onSubmit = async (data: ProjectFormData) => {
    if (!user || !id) return;

    setIsSubmitting(true);

    const expertiseArray = data.expertise_needed
      ? data.expertise_needed.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    const { error } = await supabase
      .from('projects')
      .update({
        title: data.title,
        description: data.description,
        requirements: data.requirements || null,
        budget_min: data.budget_min || null,
        budget_max: data.budget_max || null,
        duration_weeks: data.duration_weeks || null,
        expertise_needed: expertiseArray,
      })
      .eq('id', id);

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error al actualizar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Desafío actualizado',
        description: 'Los cambios han sido guardados exitosamente',
      });
      navigate(`/projects/${id}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="animate-pulse">
            <CardContent className="p-8">
              <div className="h-8 bg-muted rounded w-1/2 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to={`/projects/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Desafío
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Editar Desafío</h1>
          <p className="text-muted-foreground">
            Actualiza la información de tu desafío
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Desafío</CardTitle>
            <CardDescription>
              Modifica los campos que necesites actualizar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Desafío *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Consultoría en Transformación Digital" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe el desafío, objetivos y alcance..." 
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requisitos</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Experiencia mínima, certificaciones, idiomas..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Requisitos específicos para los consultores
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="budget_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presupuesto Mínimo (USD)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1000" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presupuesto Máximo (USD)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="5000" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="duration_weeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración Estimada (semanas)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="4" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expertise_needed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidades Requeridas</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Estrategia, Transformación Digital, Finanzas" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Separa las especialidades con comas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate(`/projects/${id}`)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="gold" 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProjectEdit;