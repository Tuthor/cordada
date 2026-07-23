import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Building2, Copy, Send, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type FirmApp = {
  id: string; legal_name: string; rut: string | null; website: string | null; founded_year: number | null;
  contact_name: string; contact_position: string | null; contact_email: string; contact_phone: string | null;
  size_consultants: number | null; size_partners: number | null; annual_revenue_uf: string | null;
  sectors: string[] | null; practice_areas: string[] | null; key_clients: string | null; certifications: string | null;
  maturity_overall: number | null; status: string; created_at: string;
  invitation_token: string | null; invitation_expires_at: string | null; activated_at: string | null;
};

type Leader = { id: string; full_name: string; position: string | null; email: string; leader_token: string; assessment_status: string };

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  in_review: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  accepted: 'bg-green-500/15 text-green-700 dark:text-green-400',
  rejected: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

export function FirmApplicationsPanel() {
  const [selected, setSelected] = useState<FirmApp | null>(null);
  const qc = useQueryClient();

  const { data: apps, isLoading } = useQuery({
    queryKey: ['firm-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('firm_applications' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as FirmApp[];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('firm_applications' as any)
      .update({ status })
      .eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Postulación ${status === 'accepted' ? 'aceptada' : 'rechazada'}` });
    qc.invalidateQueries({ queryKey: ['firm-applications'] });
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!apps?.length) return <div className="text-center py-12 text-muted-foreground"><Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Sin postulaciones de firmas.</p></div>;

  return (
    <div className="space-y-3">
      {apps.map((a) => (
        <Card key={a.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelected(a)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-base truncate">{a.legal_name}</CardTitle>
                <CardDescription className="text-xs">{a.contact_name} · {a.contact_email}</CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge className={statusColors[a.status] || ''}>{a.status}</Badge>
                {a.maturity_overall != null && (
                  <span className="text-xs text-muted-foreground">Madurez: {a.maturity_overall.toFixed(1)}/5</span>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}

      {selected && (
        <FirmDetailDialog
          app={selected}
          onClose={() => setSelected(null)}
          onStatusChange={setStatus}
          onDeleted={() => { setSelected(null); qc.invalidateQueries({ queryKey: ['firm-applications'] }); }}
        />
      )}
    </div>
  );
}

function FirmDetailDialog({ app, onClose, onStatusChange, onDeleted }: {
  app: FirmApp; onClose: () => void; onStatusChange: (id: string, s: string) => void; onDeleted: () => void;
}) {
  const { data: leaders } = useQuery({
    queryKey: ['firm-leaders', app.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('firm_application_leaders' as any)
        .select('*')
        .eq('firm_application_id', app.id);
      return (data || []) as unknown as Leader[];
    },
  });

  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sendInvitation = async () => {
    setSending(true);
    const { data, error } = await supabase.functions.invoke('send-firm-invitation', {
      body: { application_id: app.id, base_url: window.location.origin },
    });
    setSending(false);
    if (error || !data?.success) {
      toast({ title: 'Error', description: data?.error || error?.message || '', variant: 'destructive' });
      return;
    }
    toast({ title: 'Invitación enviada', description: data.email_sent ? 'Email enviado.' : (data.email_error || 'Enlace generado.') });
    navigator.clipboard.writeText(data.activation_url);
  };

  const deleteApp = async () => {
    if (!confirm(`¿Eliminar la postulación de ${app.legal_name}?`)) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke('delete-firm-application', {
      body: { application_id: app.id },
    });
    setDeleting(false);
    if (error || !data?.success) {
      toast({ title: 'Error', description: data?.error || error?.message || '', variant: 'destructive' });
      return;
    }
    toast({ title: 'Postulación eliminada' });
    onDeleted();
  };

  const copyLeaderLink = (token: string) => {
    const url = `${window.location.origin}/evaluacion-consultor?firm_token=${app.id}&leader=${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Enlace copiado' });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{app.legal_name}</DialogTitle>
          <DialogDescription>Postulación · {new Date(app.created_at).toLocaleDateString()}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <Tabs defaultValue="profile">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="leaders">Líderes</TabsTrigger>
              <TabsTrigger value="access">Acceso</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-3 mt-4 text-sm">
              <Row label="Contacto">{app.contact_name}{app.contact_position ? ` — ${app.contact_position}` : ''}</Row>
              <Row label="Email">{app.contact_email}</Row>
              <Row label="Teléfono">{app.contact_phone || '—'}</Row>
              <Row label="RUT">{app.rut || '—'}</Row>
              <Row label="Sitio">{app.website || '—'}</Row>
              <Row label="Fundación">{app.founded_year || '—'}</Row>
              <Row label="Tamaño">{app.size_consultants ?? '—'} consultores · {app.size_partners ?? '—'} socios</Row>
              <Row label="Facturación">{app.annual_revenue_uf || '—'}</Row>
              <Row label="Sectores">{(app.sectors || []).join(', ') || '—'}</Row>
              <Row label="Áreas">{(app.practice_areas || []).join(', ') || '—'}</Row>
              <Row label="Clientes">{app.key_clients || '—'}</Row>
              <Row label="Certificaciones">{app.certifications || '—'}</Row>
              <Row label="Madurez global">{app.maturity_overall != null ? `${app.maturity_overall.toFixed(2)}/5` : '—'}</Row>

              {app.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button variant="default" size="sm" onClick={() => onStatusChange(app.id, 'accepted')}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Aceptar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onStatusChange(app.id, 'rejected')}>
                    <XCircle className="w-4 h-4 mr-1" /> Rechazar
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="leaders" className="space-y-3 mt-4">
              {(leaders || []).map((l) => (
                <div key={l.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{l.full_name}{l.position ? ` — ${l.position}` : ''}</p>
                      <p className="text-xs text-muted-foreground">{l.email}</p>
                      <p className="text-xs text-muted-foreground">Evaluación: {l.assessment_status}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => copyLeaderLink(l.leader_token)}>
                      <Copy className="w-4 h-4 mr-1" /> Copiar enlace
                    </Button>
                  </div>
                </div>
              ))}
              {(!leaders || leaders.length === 0) && <p className="text-sm text-muted-foreground">Sin líderes registrados.</p>}
            </TabsContent>

            <TabsContent value="access" className="space-y-4 mt-4 text-sm">
              {app.status !== 'accepted' ? (
                <p className="text-muted-foreground">Acepta la postulación para habilitar el envío de invitación.</p>
              ) : app.activated_at ? (
                <p className="text-success">Cuenta ya activada el {new Date(app.activated_at).toLocaleString()}.</p>
              ) : (
                <div className="space-y-3">
                  <Button onClick={sendInvitation} disabled={sending}>
                    {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Send className="w-4 h-4 mr-2" />
                    {app.invitation_token ? 'Reenviar invitación' : 'Enviar invitación'}
                  </Button>
                  {app.invitation_token && (
                    <div className="text-xs">
                      <p className="text-muted-foreground mb-1">Enlace de activación:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-muted p-2 rounded break-all">
                          {`${window.location.origin}/firma/activar?token=${app.invitation_token}`}
                        </code>
                        <Button size="sm" variant="outline" onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/firma/activar?token=${app.invitation_token}`);
                          toast({ title: 'Enlace copiado' });
                        }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-4 mt-6">
                <p className="text-sm font-medium text-destructive mb-2">Zona de peligro</p>
                <Button variant="destructive" size="sm" onClick={deleteApp} disabled={deleting}>
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar postulación
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-32 shrink-0 text-muted-foreground">{label}:</span>
      <span className="flex-1">{children}</span>
    </div>
  );
}
