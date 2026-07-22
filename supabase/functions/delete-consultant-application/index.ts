import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({ application_id: z.string().uuid() });

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
    const { data: claims } = await supabase.auth.getClaims(token);
    if (!claims?.claims) return json({ error: 'Unauthorized' }, 401);

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

    const { data: app } = await admin
      .from('consultant_applications')
      .select('user_id')
      .eq('id', parsed.data.application_id)
      .maybeSingle();

    // Delete application first
    const { error: delErr } = await admin
      .from('consultant_applications')
      .delete()
      .eq('id', parsed.data.application_id);
    if (delErr) return json({ error: delErr.message }, 500);

    // If activated, also delete the auth user (cascades to profiles/roles via FK)
    if (app?.user_id) {
      const { error: userErr } = await admin.auth.admin.deleteUser(app.user_id);
      if (userErr) console.error('auth user delete error', userErr);
    }

    return json({ success: true });
  } catch (err) {
    console.error('delete-consultant-application error:', err);
    return json({ error: err instanceof Error ? err.message : 'server_error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
