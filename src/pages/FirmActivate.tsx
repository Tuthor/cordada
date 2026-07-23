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

type Phase = 'loading' | 'invalid' | 'ready' | 'activating';
type Data = { legal_name: string; contact_name: string; email: string };

const errors: Record<string, string> = {
  not_found: 'Este enlace no es válido.',
  already_used: 'Este enlace de invitación ya fue utilizado.',
  expired: 'Este enlace ha expirado. Solicita uno nuevo al equipo CORDADA.',
  not_accepted: 'Esta postulación aún no ha sido aprobada.',
  invalid_token_format: 'El enlace no tiene un formato válido.',
  server_error: 'Ocurrió un error. Intenta más tarde.',
};

export default function FirmActivate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = params.get('token');

  const [phase, setPhase] = useState<Phase>('loading');
  const [invalidReason, setInvalidReason] = useState('server_error');
  const [info, setInfo] = useState<Data | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [acceptCode, setAcceptCode] = useState(false);
  const [acceptConsent, setAcceptConsent] = useState(false);

  useEffect(() => {
    if (!token) { setInvalidReason('invalid_token_format'); setPhase('invalid'); return; }
    (async () => {
      const { data } = await supabase.functions.invoke('validate-firm-invitation', { body: { token } });
      if (!data?.valid) { setInvalidReason(data?.error || 'server_error'); setPhase('invalid'); return; }
      setInfo({ legal_name: data.legal_name, contact_name: data.contact_name, email: data.email });
      setPhase('ready');
    })();
  }, [token]);

  const canSubmit = phase === 'ready' && password.length >= 8 && password === confirmPw && acceptCode && acceptConsent;

  const activate = async () => {
    if (!canSubmit || !info) return;
    setPhase('activating');
    const { data, error } = await supabase.functions.invoke('activate-firm', {
      body: { token, password, code_of_conduct_version: CODE_OF_CONDUCT_VERSION, data_consent_version: DATA_CONSENT_VERSION },
    });
    if (error || !data?.success) {
      toast({ title: 'Error al activar', description: data?.error || error?.message || 'Intenta nuevamente.', variant: 'destructive' });
      setPhase('ready');
      return;
    }
    const { error: signErr } = await supabase.auth.signInWithPassword({ email: info.email, password });
    if (signErr) { navigate('/auth'); return; }
    toast({ title: '¡Bienvenidos a CORDADA!', description: 'Cuenta de firma activa.' });
    navigate('/dashboard');
  };

  if (phase === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  if (phase === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <CardTitle>Invitación no válida</CardTitle>
            </div>
            <CardDescription>{errors[invalidReason] || errors.server_error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full"><Link to="/">Volver al inicio</Link></Button>
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
            <h1 className="text-2xl font-bold">Activar cuenta de firma</h1>
            <p className="text-sm text-muted-foreground">
              <strong>{info?.legal_name}</strong> · {info?.contact_name} · {info?.email}
            </p>
          </div>
        </div>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Acceso privado por invitación</AlertTitle>
          <AlertDescription>
            Revisa y acepta los siguientes documentos para activar la cuenta de la firma.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>1. Código de Conducta CORDADA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollArea className="h-56 border rounded-md p-4 bg-muted/30">
              <pre className="whitespace-pre-wrap text-sm font-sans">{CODE_OF_CONDUCT_TEXT}</pre>
            </ScrollArea>
            <label className="flex items-start gap-2 cursor-pointer text-sm">
              <Checkbox checked={acceptCode} onCheckedChange={(v) => setAcceptCode(v === true)} className="mt-0.5" />
              <span>Aceptamos el <strong>Código de Conducta CORDADA</strong> (v{CODE_OF_CONDUCT_VERSION}).</span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Consentimiento de Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollArea className="h-56 border rounded-md p-4 bg-muted/30">
              <pre className="whitespace-pre-wrap text-sm font-sans">{DATA_CONSENT_TEXT}</pre>
            </ScrollArea>
            <label className="flex items-start gap-2 cursor-pointer text-sm">
              <Checkbox checked={acceptConsent} onCheckedChange={(v) => setAcceptConsent(v === true)} className="mt-0.5" />
              <span>Otorgamos consentimiento al <strong>Tratamiento de Datos Personales</strong> (v{DATA_CONSENT_VERSION}).</span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Contraseña</CardTitle>
            <CardDescription>Mínimo 8 caracteres.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
              {confirmPw && confirmPw !== password && <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild><Link to="/">Cancelar</Link></Button>
          <Button variant="gold" disabled={!canSubmit || (phase as Phase) === 'activating'} onClick={activate}>
            {(phase as Phase) === 'activating' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Activar cuenta
          </Button>
        </div>
      </div>
    </div>
  );
}
