import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mountain, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CODE_OF_CONDUCT_TEXT, CODE_OF_CONDUCT_VERSION } from '@/data/codeOfConduct';
import { DATA_CONSENT_TEXT, DATA_CONSENT_VERSION } from '@/data/dataConsent';

type State =
  | { kind: 'loading' }
  | { kind: 'invalid'; reason: string }
  | { kind: 'ready'; full_name: string; email: string }
  | { kind: 'activating' }
  | { kind: 'done' };

const errorMessages: Record<string, string> = {
  not_found: 'Este enlace no es válido.',
  already_used: 'Este enlace de invitación ya fue utilizado.',
  expired: 'Este enlace ha expirado. Solicita uno nuevo al equipo CORDADA.',
  invalid_token_format: 'El enlace no tiene un formato válido.',
  missing_token: 'Falta el token de invitación en el enlace.',
  server_error: 'Ocurrió un error al validar la invitación. Intenta más tarde.',
};

export default function ConsultantActivate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = params.get('token');

  const [state, setState] = useState<State>({ kind: 'loading' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedCode, setAcceptedCode] = useState(false);
  const [acceptedConsent, setAcceptedConsent] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid', reason: 'missing_token' });
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke('validate-consultant-invitation', {
        body: { token },
      });
      if (error || !data?.valid) {
        setState({ kind: 'invalid', reason: data?.error || 'server_error' });
      } else {
        setState({ kind: 'ready', full_name: data.full_name, email: data.email });
      }
    })();
  }, [token]);

  const canSubmit =
    state.kind === 'ready' &&
    password.length >= 8 &&
    password === confirmPassword &&
    acceptedCode &&
    acceptedConsent;

  const handleActivate = async () => {
    if (state.kind !== 'ready' || !token) return;
    if (!canSubmit) return;

    setState({ kind: 'activating' });
    const { data, error } = await supabase.functions.invoke('activate-consultant', {
      body: {
        token,
        password,
        code_of_conduct_version: CODE_OF_CONDUCT_VERSION,
        data_consent_version: DATA_CONSENT_VERSION,
      },
    });

    if (error || !data?.success) {
      toast({
        title: 'Error al activar cuenta',
        description: data?.error || error?.message || 'Intenta nuevamente.',
        variant: 'destructive',
      });
      setState({ kind: 'ready', full_name: state.full_name, email: state.email });
      return;
    }

    // Auto sign-in
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: state.email,
      password,
    });

    if (signInErr) {
      toast({
        title: 'Cuenta creada',
        description: 'Tu cuenta fue activada. Inicia sesión para continuar.',
      });
      navigate('/auth');
      return;
    }

    toast({ title: '¡Bienvenido a CORDADA!', description: 'Tu cuenta está activa.' });
    navigate('/dashboard');
  };

  if (state.kind === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.kind === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <CardTitle>Invitación no válida</CardTitle>
            </div>
            <CardDescription>{errorMessages[state.reason] || errorMessages.server_error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center">
            <Mountain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Activa tu cuenta CORDADA</h1>
            <p className="text-sm text-muted-foreground">
              Bienvenido, <strong>{state.full_name}</strong> · {state.email}
            </p>
          </div>
        </div>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Acceso privado por invitación</AlertTitle>
          <AlertDescription>
            Para completar tu ingreso al ecosistema, revisa y acepta los siguientes documentos, y define tu contraseña.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>1. Código de Conducta CORDADA</CardTitle>
            <CardDescription>Reglas del ecosistema para consultores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollArea className="h-64 border rounded-md p-4 bg-muted/30">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                {CODE_OF_CONDUCT_TEXT}
              </pre>
            </ScrollArea>
            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={acceptedCode}
                onCheckedChange={(v) => setAcceptedCode(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm">
                He leído y acepto el <strong>Código de Conducta CORDADA</strong> (v{CODE_OF_CONDUCT_VERSION}).
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Consentimiento de Datos Personales</CardTitle>
            <CardDescription>Ley 19.628 / 21.719 — Chile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollArea className="h-64 border rounded-md p-4 bg-muted/30">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                {DATA_CONSENT_TEXT}
              </pre>
            </ScrollArea>
            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={acceptedConsent}
                onCheckedChange={(v) => setAcceptedConsent(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm">
                Otorgo mi consentimiento libre, expreso e informado al{' '}
                <strong>Tratamiento de mis Datos Personales</strong> (v{DATA_CONSENT_VERSION}).
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Define tu contraseña</CardTitle>
            <CardDescription>Mínimo 8 caracteres.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw">Contraseña</Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2">Confirmar contraseña</Label>
              <Input
                id="pw2"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link to="/">Cancelar</Link>
          </Button>
          <Button
            variant="gold"
            disabled={!canSubmit || state.kind === 'activating'}
            onClick={handleActivate}
          >
            {state.kind === 'activating' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Activar mi cuenta
          </Button>
        </div>
      </div>
    </div>
  );
}
