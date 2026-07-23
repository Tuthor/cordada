import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Briefcase, Bell, Shield } from 'lucide-react';
import { expertiseOptions } from '@/data/cordadaData';

const profileSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  bio: z.string().optional(),
  phone: z.string().optional(),
});

const consultantSchema = z.object({
  headline: z.string().min(5, 'El titular debe tener al menos 5 caracteres'),
  expertise: z.array(z.string()).optional().default([]),
  hourly_rate: z.coerce.number().min(0).optional(),
  years_experience: z.coerce.number().min(0).max(50).optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type ConsultantFormData = z.infer<typeof consultantSchema>;

const Settings = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '', bio: '', phone: '' },
  });

  const consultantForm = useForm<ConsultantFormData>({
    resolver: zodResolver(consultantSchema),
    defaultValues: { headline: '', expertise: [], hourly_rate: undefined, years_experience: undefined, linkedin_url: '' },
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      if (userRole === 'consultant' || userRole === 'consulting_firm') {
        fetchConsultantProfile();
      }
    }
  }, [user, userRole]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      profileForm.reset({
        full_name: data.full_name || '',
        bio: data.bio || '',
        phone: data.phone || '',
      });
    }
    setLoading(false);
  };

  const fetchConsultantProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('consultant_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      consultantForm.reset({
        headline: data.headline || '',
        expertise: data.expertise?.join(', ') || '',
        hourly_rate: data.hourly_rate || undefined,
        years_experience: data.years_experience || undefined,
        linkedin_url: data.linkedin_url || '',
      });
    }
  };

  const onSaveProfile = async (data: ProfileFormData) => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        bio: data.bio || null,
        phone: data.phone || null,
      })
      .eq('user_id', user.id);

    setSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el perfil',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Perfil actualizado',
        description: 'Tu perfil ha sido guardado exitosamente',
      });
    }
  };

  const onSaveConsultantProfile = async (data: ConsultantFormData) => {
    if (!user) return;
    setSaving(true);

    const expertiseArray = data.expertise
      ? data.expertise.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    // Check if profile exists
    const { data: existing } = await supabase
      .from('consultant_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const profileData = {
      user_id: user.id,
      headline: data.headline,
      expertise: expertiseArray,
      hourly_rate: data.hourly_rate || null,
      years_experience: data.years_experience || null,
      linkedin_url: data.linkedin_url || null,
    };

    const { error } = existing
      ? await supabase.from('consultant_profiles').update(profileData).eq('user_id', user.id)
      : await supabase.from('consultant_profiles').insert(profileData);

    setSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el perfil de consultor',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Perfil de consultor actualizado',
        description: 'Tu información profesional ha sido guardada',
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">
            Administra tu cuenta y preferencias
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            {(userRole === 'consultant' || userRole === 'consulting_firm') && (
              <TabsTrigger value="professional" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">Profesional</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificaciones</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Seguridad</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Actualiza tu información de perfil público
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-8">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getInitials(profileForm.watch('full_name') || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{profileForm.watch('full_name') || 'Usuario'}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biografía</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Cuéntanos sobre ti..." 
                              className="min-h-24"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Una breve descripción que aparecerá en tu perfil
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="+52 555 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" variant="gold" disabled={saving}>
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {(userRole === 'consultant' || userRole === 'consulting_firm') && (
            <TabsContent value="professional" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Perfil Profesional</CardTitle>
                  <CardDescription>
                    Información visible para clientes potenciales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...consultantForm}>
                    <form onSubmit={consultantForm.handleSubmit(onSaveConsultantProfile)} className="space-y-6">
                      <FormField
                        control={consultantForm.control}
                        name="headline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Titular profesional</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ej: Consultor Senior en Transformación Digital" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={consultantForm.control}
                        name="expertise"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Especialidades</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Estrategia, Finanzas, Operaciones" 
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

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={consultantForm.control}
                          name="hourly_rate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tarifa por hora (USD)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="150" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={consultantForm.control}
                          name="years_experience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Años de experiencia</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={consultantForm.control}
                        name="linkedin_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://linkedin.com/in/tuperfil" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" variant="gold" disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar Perfil Profesional'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>
                  Configura cómo quieres recibir notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Próximamente: Configuración de notificaciones por email y en la plataforma.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>
                  Administra la seguridad de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Email</h4>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Cambiar contraseña</h4>
                  <Button variant="outline">Solicitar cambio de contraseña</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
