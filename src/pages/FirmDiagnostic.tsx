import { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Copy, CheckCircle2, Loader2, Mountain, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  FIRM_MATURITY_DIMENSIONS,
  SECTOR_OPTIONS,
  PRACTICE_AREA_OPTIONS,
  REVENUE_RANGES,
} from '@/data/firmAssessmentData';
import { CODE_OF_CONDUCT_TEXT, CODE_OF_CONDUCT_VERSION } from '@/data/codeOfConduct';
import { DATA_CONSENT_TEXT, DATA_CONSENT_VERSION } from '@/data/dataConsent';

type Leader = { full_name: string; position: string; email: string; linkedin: string };
type LeaderLink = { id: string; full_name: string; position: string | null; email: string; url: string };

const emptyLeader = (): Leader => ({ full_name: '', position: '', email: '', linkedin: '' });

export default function FirmDiagnostic() {
  const [firm, setFirm] = useState({
    legal_name: '',
    rut: '',
    website: '',
    founded_year: '',
    contact_name: '',
    contact_position: '',
    contact_email: '',
    contact_phone: '',
    size_consultants: '',
    size_partners: '',
    annual_revenue_uf: '',
    key_clients: '',
    certifications: '',
  });
  const [sectors, setSectors] = useState<string[]>([]);
  const [practices, setPractices] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [leaders, setLeaders] = useState<Leader[]>([emptyLeader()]);
  const [acceptCoC, setAcceptCoC] = useState(false);
  const [acceptConsent, setAcceptConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ leaders: LeaderLink[] } | null>(null);

  const setF = (k: keyof typeof firm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFirm((f) => ({ ...f, [k]: e.target.value }));

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const updateLeader = (i: number, k: keyof Leader, v: string) =>
    setLeaders((ls) => ls.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));

  const addLeader = () => setLeaders((ls) => (ls.length < 10 ? [...ls, emptyLeader()] : ls));
  const removeLeader = (i: number) => setLeaders((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls));

  const canSubmit = useMemo(() => {
    if (!firm.legal_name.trim() || !firm.contact_name.trim() || !firm.contact_email.trim()) return false;
    if (!acceptCoC || !acceptConsent) return false;
    if (leaders.length === 0) return false;
    for (const l of leaders) {
      if (!l.full_name.trim() || !l.email.trim()) return false;
    }
    if (FIRM_MATURITY_DIMENSIONS.some((d) => !answers[d.id])) return false;
    return true;
  }, [firm, leaders, acceptCoC, acceptConsent, answers]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast({ title: 'Faltan datos', description: 'Completa todos los campos obligatorios.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('submit-firm-application', {
      body: {
        legal_name: firm.legal_name.trim(),
        rut: firm.rut.trim(),
        website: firm.website.trim(),
        founded_year: firm.founded_year ? Number(firm.founded_year) : null,
        contact_name: firm.contact_name.trim(),
        contact_position: firm.contact_position.trim(),
        contact_email: firm.contact_email.trim(),
        contact_phone: firm.contact_phone.trim(),
        size_consultants: firm.size_consultants ? Number(firm.size_consultants) : null,
        size_partners: firm.size_partners ? Number(firm.size_partners) : null,
        annual_revenue_uf: firm.annual_revenue_uf,
        sectors,
        practice_areas: practices,
        key_clients: firm.key_clients.trim(),
        certifications: firm.certifications.trim(),
        maturity_answers: answers,
        accepted_code_of_conduct: true,
        accepted_data_consent: true,
        leaders: leaders.map((l) => ({
          full_name: l.full_name.trim(),
          position: l.position.trim(),
          email: l.email.trim(),
          linkedin: l.linkedin.trim(),
        })),
        base_url: window.location.origin,
      },
    });
    setSubmitting(false);
    if (error || !data?.success) {
      toast({ title: 'Error al enviar', description: (data?.error && JSON.stringify(data.error)) || error?.message || 'Intenta nuevamente.', variant: 'destructive' });
      return;
    }
    setResult({ leaders: data.leaders as LeaderLink[] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (result) {
    return <Confirmation leaders={result.leaders} legalName={firm.legal_name} />;
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center">
            <Mountain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Postulación de Empresa Consultora</h1>
            <p className="text-sm text-muted-foreground">
              El ingreso al ecosistema CORDADA es privado. Completa este formulario para postular a tu firma.
            </p>
          </div>
        </div>

        {/* Section A */}
        <Card>
          <CardHeader>
            <CardTitle>1. Perfil de la firma</CardTitle>
            <CardDescription>Datos generales de la empresa consultora.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Field label="Razón social *"><Input value={firm.legal_name} onChange={setF('legal_name')} /></Field>
            <Field label="RUT"><Input value={firm.rut} onChange={setF('rut')} placeholder="76.xxx.xxx-x" /></Field>
            <Field label="Sitio web"><Input value={firm.website} onChange={setF('website')} placeholder="https://" /></Field>
            <Field label="Año de fundación"><Input type="number" value={firm.founded_year} onChange={setF('founded_year')} /></Field>
            <Field label="Nº de consultores"><Input type="number" value={firm.size_consultants} onChange={setF('size_consultants')} /></Field>
            <Field label="Nº de socios"><Input type="number" value={firm.size_partners} onChange={setF('size_partners')} /></Field>
            <Field label="Facturación anual">
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={firm.annual_revenue_uf} onChange={setF('annual_revenue_uf' as any) as any}>
                <option value="">Seleccionar rango</option>
                {REVENUE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <div />
            <Field label="Contacto principal *"><Input value={firm.contact_name} onChange={setF('contact_name')} /></Field>
            <Field label="Cargo del contacto"><Input value={firm.contact_position} onChange={setF('contact_position')} /></Field>
            <Field label="Email del contacto *"><Input type="email" value={firm.contact_email} onChange={setF('contact_email')} /></Field>
            <Field label="Teléfono"><Input value={firm.contact_phone} onChange={setF('contact_phone')} /></Field>

            <div className="md:col-span-2 space-y-2">
              <Label>Sectores atendidos</Label>
              <ChipList options={SECTOR_OPTIONS} selected={sectors} onToggle={(v) => toggle(sectors, setSectors, v)} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Áreas de práctica</Label>
              <ChipList options={PRACTICE_AREA_OPTIONS} selected={practices} onToggle={(v) => toggle(practices, setPractices, v)} />
            </div>

            <Field className="md:col-span-2" label="Clientes representativos (últimos 3 años)">
              <Textarea value={firm.key_clients} onChange={setF('key_clients')} rows={3} />
            </Field>
            <Field className="md:col-span-2" label="Certificaciones y alianzas">
              <Textarea value={firm.certifications} onChange={setF('certifications')} rows={2} />
            </Field>
          </CardContent>
        </Card>

        {/* Section B - Leaders */}
        <Card>
          <CardHeader>
            <CardTitle>2. Consultores líderes representantes</CardTitle>
            <CardDescription>
              Ingresa los líderes que representarán a la firma. Al enviar, recibirás un enlace único por cada líder para que realicen su Diagnóstico de Madurez individual. Podrás enviárselos por el medio que prefieras.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {leaders.map((l, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Líder {i + 1}</span>
                  {leaders.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeLeader(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Nombre completo *"><Input value={l.full_name} onChange={(e) => updateLeader(i, 'full_name', e.target.value)} /></Field>
                  <Field label="Cargo"><Input value={l.position} onChange={(e) => updateLeader(i, 'position', e.target.value)} /></Field>
                  <Field label="Email corporativo *"><Input type="email" value={l.email} onChange={(e) => updateLeader(i, 'email', e.target.value)} /></Field>
                  <Field label="LinkedIn"><Input value={l.linkedin} onChange={(e) => updateLeader(i, 'linkedin', e.target.value)} placeholder="linkedin.com/in/..." /></Field>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addLeader} disabled={leaders.length >= 10}>
              <Plus className="w-4 h-4 mr-2" /> Agregar otro líder
            </Button>
          </CardContent>
        </Card>

        {/* Section C - Maturity */}
        <Card>
          <CardHeader>
            <CardTitle>3. Madurez de la firma</CardTitle>
            <CardDescription>Evalúa cada dimensión de 1 (incipiente) a 5 (excelencia consolidada).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {FIRM_MATURITY_DIMENSIONS.map((d) => (
              <div key={d.id} className="border rounded-lg p-4">
                <p className="font-medium">{d.name}</p>
                <p className="text-sm text-muted-foreground mb-3">{d.description}</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [d.id]: v }))}
                      className={`w-10 h-10 rounded-md border text-sm font-medium transition-colors ${
                        answers[d.id] === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Consents */}
        <Card>
          <CardHeader>
            <CardTitle>4. Consentimientos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-40 border rounded-md p-3 bg-muted/30">
              <pre className="whitespace-pre-wrap text-xs font-sans">{CODE_OF_CONDUCT_TEXT}</pre>
            </ScrollArea>
            <label className="flex items-start gap-2 cursor-pointer text-sm">
              <Checkbox checked={acceptCoC} onCheckedChange={(v) => setAcceptCoC(v === true)} className="mt-0.5" />
              <span>He leído y acepto el <strong>Código de Conducta CORDADA</strong> (v{CODE_OF_CONDUCT_VERSION}).</span>
            </label>
            <ScrollArea className="h-40 border rounded-md p-3 bg-muted/30">
              <pre className="whitespace-pre-wrap text-xs font-sans">{DATA_CONSENT_TEXT}</pre>
            </ScrollArea>
            <label className="flex items-start gap-2 cursor-pointer text-sm">
              <Checkbox checked={acceptConsent} onCheckedChange={(v) => setAcceptConsent(v === true)} className="mt-0.5" />
              <span>Otorgo mi consentimiento al <strong>Tratamiento de Datos Personales</strong> (v{DATA_CONSENT_VERSION}).</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild><Link to="/">Cancelar</Link></Button>
          <Button variant="gold" disabled={!canSubmit || submitting} onClick={handleSubmit}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enviar postulación
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function ChipList({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Confirmation({ leaders, legalName }: { leaders: LeaderLink[]; legalName: string }) {
  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    toast({ title: 'Copiado al portapapeles' });
  };
  const copyAll = () => {
    const msg = leaders
      .map(
        (l) =>
          `${l.full_name}${l.position ? ` (${l.position})` : ''} — ${l.email}\n${l.url}`
      )
      .join('\n\n');
    copy(`Enlaces individuales de Diagnóstico de Madurez — ${legalName}\n\n${msg}`);
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-success" />
              <div>
                <CardTitle>Postulación recibida</CardTitle>
                <CardDescription>
                  Tu postulación de <strong>{legalName}</strong> fue recibida. Nuestro equipo la revisará y te contactará.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enlaces para tus líderes</CardTitle>
            <CardDescription>
              Copia y envía cada enlace al líder correspondiente por el medio que prefieras (email, WhatsApp, etc.). Cada enlace es personal y le permitirá realizar su Diagnóstico de Madurez del Consultor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaders.map((l) => (
              <div key={l.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{l.full_name}{l.position ? ` — ${l.position}` : ''}</p>
                    <p className="text-xs text-muted-foreground">{l.email}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => copy(l.url)}>
                    <Copy className="w-4 h-4 mr-1" /> Copiar
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs bg-muted/40 rounded p-2 break-all">
                  <LinkIcon className="w-3 h-3 shrink-0" /> {l.url}
                </div>
              </div>
            ))}
            <Button variant="gold" className="w-full" onClick={copyAll}>
              <Copy className="w-4 h-4 mr-2" /> Copiar todos los enlaces
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button asChild variant="outline"><Link to="/">Volver al inicio</Link></Button>
        </div>
      </div>
    </div>
  );
}
