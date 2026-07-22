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
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

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

    // Get TTL from platform_settings
    const { data: ttlSetting } = await admin
      .from('platform_settings')
      .select('value')
      .eq('key', 'consultant_invitation_ttl_days')
      .maybeSingle();
    const ttlDays = Number(ttlSetting?.value ?? 14) || 14;

    // Get application
    const { data: app, error: appErr } = await admin
      .from('consultant_applications')
      .select('id, full_name, email, status, user_id')
      .eq('id', application_id)
      .single();
    if (appErr || !app) return json({ error: 'Application not found' }, 404);
    if (app.status !== 'aceptado') return json({ error: 'Application not accepted' }, 400);
    if (app.user_id) return json({ error: 'Consultant already activated' }, 400);

    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

    const { error: updErr } = await admin
      .from('consultant_applications')
      .update({
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt,
        invitation_used_at: null,
      })
      .eq('id', application_id);
    if (updErr) return json({ error: updErr.message }, 500);

    const activationUrl = `${base_url.replace(/\/$/, '')}/consultor/activar?token=${invitationToken}`;

    // Send email
    const resendKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;
    let emailError: string | null = null;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const { error } = await resend.emails.send({
          from: 'CORDADA <onboarding@resend.dev>',
          to: [app.email],
          subject: 'Bienvenido a CORDADA — activa tu cuenta de consultor',
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b">
              <h1 style="color:#1e3a5f">Bienvenido a CORDADA, ${escapeHtml(app.full_name)}</h1>
              <p>Tu postulación fue <strong>aprobada</strong>. Para completar tu ingreso al ecosistema, activa tu cuenta haciendo clic en el siguiente botón. Deberás aceptar el Código de Conducta y el Consentimiento para el Tratamiento de Datos Personales, y definir tu contraseña.</p>
              <p style="text-align:center;margin:32px 0">
                <a href="${activationUrl}" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Activar mi cuenta</a>
              </p>
              <p style="font-size:14px;color:#64748b">Este enlace es personal y estará vigente por ${ttlDays} días. Si no lo reconoces, ignora este mensaje.</p>
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
    console.error('send-consultant-invitation error:', err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
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
