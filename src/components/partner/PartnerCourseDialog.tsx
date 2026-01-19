import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const courseSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  course_type: z.enum(['course', 'workshop']),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  currency: z.string().default('CLP'),
  duration_hours: z.coerce.number().min(1).optional().nullable(),
  max_participants: z.coerce.number().min(1).optional().nullable(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface PartnerCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: PartnerCourse | null;
}

export function PartnerCourseDialog({ open, onOpenChange, course }: PartnerCourseDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!course;

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      course_type: 'course',
      price: 0,
      currency: 'CLP',
      duration_hours: null,
      max_participants: null,
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        description: course.description || '',
        course_type: course.course_type,
        price: Number(course.price),
        currency: course.currency,
        duration_hours: course.duration_hours,
        max_participants: course.max_participants,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        course_type: 'course',
        price: 0,
        currency: 'CLP',
        duration_hours: null,
        max_participants: null,
      });
    }
  }, [course, form]);

  const mutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      if (isEditing && course) {
        const { error } = await supabase
          .from('partner_courses')
          .update({
            title: values.title,
            description: values.description || null,
            course_type: values.course_type,
            price: values.price,
            currency: values.currency,
            duration_hours: values.duration_hours || null,
            max_participants: values.max_participants || null,
          })
          .eq('id', course.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('partner_courses')
          .insert({
            partner_id: user?.id,
            title: values.title,
            description: values.description || null,
            course_type: values.course_type,
            price: values.price,
            currency: values.currency,
            duration_hours: values.duration_hours || null,
            max_participants: values.max_participants || null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-courses'] });
      toast.success(isEditing ? 'Curso actualizado' : 'Curso creado');
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Error saving course:', error);
      toast.error('Error al guardar el curso');
    },
  });

  const onSubmit = (values: CourseFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Curso/Taller' : 'Nuevo Curso/Taller'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los detalles de tu curso o taller'
              : 'Crea un nuevo curso o taller para la comunidad'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="course_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="course">Curso</SelectItem>
                      <SelectItem value="workshop">Taller</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Introducción a la Consultoría" {...field} />
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
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe el contenido y objetivos del curso..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>En pesos chilenos (CLP)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (horas)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ej: 8"
                        min="1"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="max_participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máximo de Participantes (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Sin límite"
                      min="1"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription>Deja vacío para sin límite</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="gold" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Curso'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}