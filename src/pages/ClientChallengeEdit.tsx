import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { visibilityModeOptions } from '@/data/cordadaData';
import { OpenFiltersEditor } from '@/components/client/OpenFiltersEditor';
import type { CordadaOpenFilters } from '@/types/cordada';

const openFiltersSchema = z
  .object({
    archetypes: z.array(z.string()).optional(),
    min_maturity_level: z.string().optional(),
    expertise_tags: z.array(z.string()).optional(),
    availability_required: z.boolean().optional(),
  })
  .nullable()
  .optional();

const challengeSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  terrain: z.string().optional(),
  risks: z.string().optional(),
  objectives: z.string().optional(),
  required_expertise: z.string().optional(),
  budget_amount: z.coerce.number().min(0).optional(),
  budget_currency: z.enum(['CLP', 'UF', 'USD']).optional(),
  estimated_duration_weeks: z.coerce.number().min(1).max(52).optional(),
  visibility_mode: z.enum(['curated', 'open_filtered']).default('curated'),
  open_filters: openFiltersSchema,
});

type ChallengeFormData = z.infer<typeof challengeSchema>;

const ClientChallengeEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: cordada, isLoading } = useQuery({
    queryKey: ['cordada-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cordadas')
        .select('*')
        .eq('id', id)
        .eq('client_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  const form = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: '',
      description: '',
      terrain: '',
      risks: '',
      objectives: '',
      required_expertise: '',
      budget_currency: 'CLP',
      visibility_mode: 'curated',
      open_filters: null,
    },
  });

  const visibilityMode = form.watch('visibility_mode');

  useEffect(() => {
    if (cordada) {
      const anyC = cordada as any;
      form.reset({
        title: cordada.title,
        description: cordada.description || '',
        terrain: cordada.terrain || '',
        risks: cordada.risks || '',
        objectives: cordada.objectives?.join('\n') || '',
        required_expertise: cordada.required_expertise?.join(', ') || '',
        budget_amount: cordada.budget_amount || undefined,
        budget_currency: (cordada.budget_currency as 'CLP' | 'UF' | 'USD') || 'CLP',
        estimated_duration_weeks: cordada.estimated_duration_weeks || undefined,
        visibility_mode: (anyC.visibility_mode as 'curated' | 'open_filtered') || 'curated',
        open_filters: (anyC.open_filters as CordadaOpenFilters | null) ?? null,
      });
    }
  }, [cordada, form]);

  const onSubmit = async (data: ChallengeFormData) => {
    if (!user || !id) return;

    setIsSubmitting(true);

    const objectivesArray = data.objectives
      ? data.objectives.split('\n').map(s => s.trim()).filter(Boolean)
      : null;

    const expertiseArray = data.required_expertise
      ? data.required_expertise.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    const { error } = await supabase
      .from('cordadas')
      .update({
        title: data.title,
        description: data.description,
        terrain: data.terrain || null,
        risks: data.risks || null,
        objectives: objectivesArray,
        required_expertise: expertiseArray,
        budget_amount: data.budget_amount || null,
        budget_currency: data.budget_currency || 'CLP',
        estimated_duration_weeks: data.estimated_duration_weeks || null,
        visibility_mode: data.visibility_mode,
        open_filters: data.visibility_mode === 'open_filtered' ? (data.open_filters ?? null) : null,
      } as any)
      .eq('id', id)
      .eq('client_id', user.id);

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
        description: 'Los cambios han sido guardados',
      });
      navigate('/challenges');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!cordada) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold">Desafío no encontrado</h2>
          <Button asChild variant="link" className="mt-4">
            <Link to="/challenges">Volver a Desafíos</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (cordada.status !== 'draft') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold">Solo puedes editar desafíos en borrador</h2>
          <Button asChild variant="link" className="mt-4">
            <Link to="/challenges">Volver a Desafíos</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/challenges">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Desafíos
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Editar Desafío</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Desafío</CardTitle>
            <CardDescription>
              Modifica la información de tu desafío
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
                        <Input {...field} />
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
                        <Textarea className="min-h-32" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="terrain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terreno (Contexto)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="risks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Riesgos y Obstáculos</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="objectives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivos</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormDescription>Un objetivo por línea</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="required_expertise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidades Requeridas</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>Separa con comas</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="budget_currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CLP">CLP</SelectItem>
                            <SelectItem value="UF">UF</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget_amount"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Presupuesto</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="estimated_duration_weeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración Estimada (semanas)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/challenges')}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="gold" disabled={isSubmitting} className="flex-1">
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

export default ClientChallengeEdit;
