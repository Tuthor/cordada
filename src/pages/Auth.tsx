import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase, Mail, Lock, User, Building2, Users, ArrowLeft, Loader2, Handshake } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/BackButton';

const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['client', 'partner'], {
    required_error: 'Selecciona un tipo de cuenta',
  }),
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

const roleOptions = [
  {
    value: 'client' as const,
    label: 'Cliente (Empresa)',
    description: 'Busco consultores para mis desafíos',
    icon: Building2,
  },
  {
    value: 'partner' as const,
    label: 'Partner',
    description: 'Aliado estratégico del ecosistema',
    icon: Handshake,
  },
];

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '', role: undefined },
  });

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (data: SignInFormData) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error al iniciar sesión',
        description: error.message === 'Invalid login credentials' 
          ? 'Credenciales incorrectas. Verifica tu email y contraseña.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bienvenido',
        description: 'Has iniciado sesión correctamente.',
      });
      navigate('/dashboard');
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    const { error } = await signUp(data.email, data.password, data.fullName, data.role);
    setIsSubmitting(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'Este email ya está registrado. Intenta iniciar sesión.';
      }
      toast({
        title: 'Error al crear cuenta',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Cuenta creada',
        description: 'Tu cuenta ha sido creada exitosamente.',
      });
      navigate('/dashboard');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { 
          email: resetEmail,
          redirectUrl: redirectUrl
        }
      });

      if (error) throw error;

      toast({
        title: "Correo enviado",
        description: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña.",
      });
      
      setShowResetPassword(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar el correo. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero text-primary-foreground p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-lg bg-gold flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">CORDADA</h1>
              <p className="text-primary-foreground/70">Ecosistema de Consultoría</p>
            </div>
          </Link>
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Conecta con los mejores<br />
            <span className="text-gradient-gold">consultores del mercado</span>
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            La plataforma líder para empresas que buscan talento consultor de élite 
            y consultores que desean crecer profesionalmente.
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-gold" />
            </div>
            <span className="text-primary-foreground/90">+500 consultores verificados</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-gold" />
            </div>
            <span className="text-primary-foreground/90">+100 empresas activas</span>
          </div>
        </div>
      </div>

      {/* Right side - Forms */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md mb-4">
          <BackButton />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link to="/" className="lg:hidden flex items-center justify-center gap-3 mb-4 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">CORDADA</span>
            </Link>
            <CardTitle>Accede a tu cuenta</CardTitle>
            <CardDescription>
              Inicia sesión o crea una cuenta nueva
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showResetPassword ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </button>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Recuperar contraseña</h3>
                  <p className="text-sm text-muted-foreground">
                    Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
                  </p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10"
                      disabled={resetLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="gold"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar enlace de recuperación'
                    )}
                  </Button>
                </form>
              </div>
            ) : (
            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
                <TabsTrigger value="signin">Tengo Cuenta</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="tu@email.com" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      variant="gold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup">
                <div className="mb-4 p-3 rounded-md bg-muted/40 border text-xs text-muted-foreground space-y-2">
                  <p>
                    ¿Eres consultor? El acceso al ecosistema es <strong>solo por invitación</strong>. Realiza el{' '}
                    <a href="/evaluacion-consultor" className="underline text-primary">Diagnóstico de Madurez</a> y, si eres aprobado,
                    recibirás un enlace privado para activar tu cuenta.
                  </p>
                  <p>
                    ¿Representas una empresa consultora? Postula a través del{' '}
                    <a href="/diagnostico-firma" className="underline text-primary">Diagnóstico de Firma</a>.
                  </p>
                </div>
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                    <FormField
                      control={signUpForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre completo</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="Juan Pérez" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="tu@email.com" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de cuenta</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid gap-3"
                            >
                              {roleOptions.map((option) => (
                                <label
                                  key={option.value}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                    field.value === option.value
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <RadioGroupItem value={option.value} className="sr-only" />
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    field.value === option.value
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-secondary text-secondary-foreground'
                                  }`}>
                                    <option.icon className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{option.label}</p>
                                    <p className="text-sm text-muted-foreground">{option.description}</p>
                                  </div>
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      variant="gold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
