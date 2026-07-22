import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(8).max(128),
  code_of_conduct_version: z.string().min(1),
  data_consent_version: z.string().min(1),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const { token, password } = parsed.data;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: app, error: appErr } = await admin
      .from('consultant_applications')
      .select('id, full_name, email, invitation_expires_at, invitation_used_at, user_id, status')
      .eq('invitation_token', token)
      .maybeSingle();

    if (appErr || !app) return json({ error: 'invalid_token' }, 400);
    if (app.status !== 'aceptado') return json({ error: 'not_accepted' }, 400);
    if (app.invitation_used_at || app.user_id) return json({ error: 'already_used' }, 400);
    if (app.invitation_expires_at && new Date(app.invitation_expires_at) < new Date()) {
      return json({ error: 'expired' }, 400);
    }

    // Create auth user (email pre-confirmed)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: app.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: app.full_name,
        // NOTE: 'role' intentionally omitted — 'consultant' role is inserted directly below
      },
    });

    if (createErr || !created?.user) {
      return json({ error: createErr?.message || 'user_creation_failed' }, 400);
    }

    const userId = created.user.id;
    const now = new Date().toISOString();

    // Insert profile
    await admin.from('profiles').upsert(
      { user_id: userId, full_name: app.full_name, email: app.email },
      { onConflict: 'user_id' }
    );

    // Assign consultant role
    const { error: roleErr } = await admin
      .from('user_roles')
      .insert({ user_id: userId, role: 'consultant' });
    if (roleErr && !roleErr.message.includes('duplicate')) {
      console.error('role insert error', roleErr);
    }

    // Create consultant_profile
    await admin.from('consultant_profiles').upsert(
      { user_id: userId, is_available: true },
      { onConflict: 'user_id' }
    );

    // Mark application as activated
    const { error: linkErr } = await admin
      .from('consultant_applications')
      .update({
        user_id: userId,
        invitation_used_at: now,
        code_of_conduct_accepted: true,
        code_of_conduct_accepted_at: now,
        data_consent_accepted_at: now,
      })
      .eq('id', app.id);

    if (linkErr) {
      console.error('application update error', linkErr);
    }

    return json({ success: true, email: app.email });
  } catch (err) {
    console.error('activate-consultant error:', err);
    return json({ error: err instanceof Error ? err.message : 'server_error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
