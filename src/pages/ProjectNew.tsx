import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Link } from 'react-router-dom';

const projectSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  requirements: z.string().optional(),
  budget_min: z.coerce.number().min(0).optional(),
  budget_max: z.coerce.number().min(0).optional(),
  duration_weeks: z.coerce.number().min(1).max(52).optional(),
  expertise_needed: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const ProjectNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      requirements: '',
      expertise_needed: '',
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para crear un proyecto',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const expertiseArray = data.expertise_needed
      ? data.expertise_needed.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    const { error } = await supabase.from('projects').insert({
      client_id: user.id,
      title: data.title,
      description: data.description,
      requirements: data.requirements || null,
      budget_min: data.budget_min || null,
      budget_max: data.budget_max || null,
      duration_weeks: data.duration_weeks || null,
      expertise_needed: expertiseArray,
      status: 'open',
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error al crear proyecto',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Proyecto creado',
        description: 'Tu proyecto ha sido publicado exitosamente',
      });
      navigate('/projects');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/projects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Proyectos
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Publicar Nuevo Proyecto</h1>
          <p className="text-muted-foreground">
            Describe tu proyecto para atraer a los mejores consultores
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Proyecto</CardTitle>
            <CardDescription>
              Proporciona información clara y detallada
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
                      <FormLabel>Título del Proyecto *</FormLabel>
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
                          placeholder="Describe el proyecto, objetivos y alcance..." 
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
                    onClick={() => navigate('/projects')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="gold" 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Publicando...' : 'Publicar Proyecto'}
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

export default ProjectNew;
