import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  application_id: z.string().uuid(),
  base_url: z.string().url(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: claims.claims.sub,
      _role: 'admin',
    });
    if (!isAdmin) return json({ error: 'Forbidden' }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const { application_id, base_url } = parsed.data;

    const { data: ttlSetting } = await admin
      .from('platform_settings')
      .select('value')
      .eq('key', 'firm_invitation_ttl_hours')
      .maybeSingle();
    const ttlHours = Number(ttlSetting?.value ?? 168) || 168;

    const { data: app, error: appErr } = await admin
      .from('firm_applications')
      .select('id, legal_name, contact_name, contact_email, status, activated_user_id')
      .eq('id', application_id)
      .single();
    if (appErr || !app) return json({ error: 'Application not found' }, 404);
    if (app.status !== 'accepted') return json({ error: 'Application not accepted' }, 400);
    if (app.activated_user_id) return json({ error: 'Firm already activated' }, 400);

    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

    const { error: updErr } = await admin
      .from('firm_applications')
      .update({
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt,
        invitation_sent_at: new Date().toISOString(),
      })
      .eq('id', application_id);
    if (updErr) return json({ error: updErr.message }, 500);

    const activationUrl = `${base_url.replace(/\/$/, '')}/firma/activar?token=${invitationToken}`;

    const resendKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;
    let emailError: string | null = null;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const { error } = await resend.emails.send({
          from: 'CORDADA <onboarding@resend.dev>',
          to: [app.contact_email],
          subject: 'Bienvenidos a CORDADA — activen su cuenta de firma consultora',
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b">
              <h1 style="color:#1e3a5f">Bienvenidos, ${escapeHtml(app.legal_name)}</h1>
              <p>Hola ${escapeHtml(app.contact_name)}, la postulación de su firma fue <strong>aprobada</strong>. Para activar la cuenta de la firma, haga clic en el siguiente botón y acepte el Código de Conducta y el Consentimiento para el Tratamiento de Datos Personales.</p>
              <p style="text-align:center;margin:32px 0">
                <a href="${activationUrl}" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Activar cuenta de la firma</a>
              </p>
              <p style="font-size:14px;color:#64748b">Este enlace es personal y estará vigente por ${ttlHours} horas.</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
              <p style="font-size:12px;color:#94a3b8">CORDADA — Ecosistema de Consultoría Empresarial</p>
            </div>
          `,
        });
        if (error) emailError = String(error);
        else emailSent = true;
      } catch (e) {
        emailError = e instanceof Error ? e.message : String(e);
      }
    } else {
      emailError = 'RESEND_API_KEY not configured';
    }

    return json({ success: true, activation_url: activationUrl, expires_at: expiresAt, email_sent: emailSent, email_error: emailError });
  } catch (err) {
    console.error('send-firm-invitation error:', err);
    return json({ error: err instanceof Error ? err.message : 'server_error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
