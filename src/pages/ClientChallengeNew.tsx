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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { visibilityModeOptions } from '@/data/cordadaData';
import { OpenFiltersEditor } from '@/components/client/OpenFiltersEditor';
import type { CordadaOpenFilters, CordadaVisibilityMode } from '@/types/cordada';

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

const ClientChallengeNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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


  const onSubmit = async (data: ChallengeFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para crear un desafío',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const objectivesArray = data.objectives
      ? data.objectives.split('\n').map(s => s.trim()).filter(Boolean)
      : null;

    const expertiseArray = data.required_expertise
      ? data.required_expertise.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    const { data: insertedCordada, error } = await supabase
      .from('cordadas')
      .insert({
        client_id: user.id,
        title: data.title,
        description: data.description,
        terrain: data.terrain || null,
        risks: data.risks || null,
        objectives: objectivesArray,
        required_expertise: expertiseArray,
        budget_amount: data.budget_amount || null,
        budget_currency: data.budget_currency || 'CLP',
        estimated_duration_weeks: data.estimated_duration_weeks || null,
        status: 'draft',
        visibility_mode: data.visibility_mode,
        open_filters: data.visibility_mode === 'open_filtered' ? (data.open_filters ?? null) : null,
      } as any)
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error al crear desafío',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Desafío creado',
        description: 'Tu desafío ha sido creado como borrador',
      });
      navigate('/challenges');
    }
  };

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
          <h1 className="text-2xl font-bold text-foreground">Nuevo Desafío</h1>
          <p className="text-muted-foreground">
            Define tu desafío de consultoría para armar el equipo ideal
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Desafío</CardTitle>
            <CardDescription>
              Describe el desafío que necesitas resolver
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
                          placeholder="Ej: Transformación Digital del Área Comercial" 
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
                          placeholder="Describe el contexto, situación actual y qué esperas lograr..." 
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
                  name="terrain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terreno (Contexto)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe el contexto organizacional, cultura, estructura..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        El ambiente donde se desarrollará el trabajo
                      </FormDescription>
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
                        <Textarea 
                          placeholder="Resistencia al cambio, plazos ajustados, dependencias..." 
                          {...field} 
                        />
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
                        <Textarea 
                          placeholder="Un objetivo por línea&#10;Aumentar ventas en 20%&#10;Reducir tiempo de respuesta" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Ingresa un objetivo por línea
                      </FormDescription>
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
                        <Input 
                          placeholder="Estrategia, Transformación Digital, Gestión del Cambio" 
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

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="budget_currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Moneda" />
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
                          <Input 
                            type="number" 
                            placeholder="5000000" 
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
                  name="estimated_duration_weeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración Estimada (semanas)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="8" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility_mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modo de convocatoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {visibilityModeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {visibilityModeOptions.find((o) => o.value === field.value)?.description}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {visibilityMode === 'open_filtered' && (
                  <FormField
                    control={form.control}
                    name="open_filters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Filtros de perfiles</FormLabel>
                        <FormControl>
                          <OpenFiltersEditor
                            value={(field.value as CordadaOpenFilters | null) ?? null}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/challenges')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="gold" 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear Desafío'}
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

export default ClientChallengeNew;
