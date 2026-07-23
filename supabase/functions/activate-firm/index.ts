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
      .from('firm_applications')
      .select('id, legal_name, website, contact_name, contact_email, status, invitation_expires_at, activated_at, activated_user_id')
      .eq('invitation_token', token)
      .maybeSingle();

    if (appErr || !app) return json({ error: 'invalid_token' }, 400);
    if (app.status !== 'accepted') return json({ error: 'not_accepted' }, 400);
    if (app.activated_at || app.activated_user_id) return json({ error: 'already_used' }, 400);
    if (app.invitation_expires_at && new Date(app.invitation_expires_at) < new Date()) {
      return json({ error: 'expired' }, 400);
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: app.contact_email,
      password,
      email_confirm: true,
      user_metadata: { full_name: app.contact_name },
    });

    if (createErr || !created?.user) {
      return json({ error: createErr?.message || 'user_creation_failed' }, 400);
    }

    const userId = created.user.id;
    const now = new Date().toISOString();

    await admin.from('profiles').upsert(
      { user_id: userId, full_name: app.contact_name, email: app.contact_email },
      { onConflict: 'user_id' }
    );

    const { error: roleErr } = await admin
      .from('user_roles')
      .insert({ user_id: userId, role: 'consulting_firm' });
    if (roleErr && !roleErr.message.includes('duplicate')) {
      console.error('role insert error', roleErr);
    }

    // Create consulting_firms row
    await admin.from('consulting_firms').insert({
      name: app.legal_name,
      website: app.website,
      owner_id: userId,
    });

    await admin
      .from('firm_applications')
      .update({
        activated_user_id: userId,
        activated_at: now,
      })
      .eq('id', app.id);

    return json({ success: true, email: app.contact_email });
  } catch (err) {
    console.error('activate-firm error:', err);
    return json({ error: err instanceof Error ? err.message : 'server_error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
