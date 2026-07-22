import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({ token: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ valid: false, error: 'invalid_token_format' }, 400);
    const { token } = parsed.data;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: app } = await admin
      .from('consultant_applications')
      .select('id, full_name, email, invitation_expires_at, invitation_used_at, user_id')
      .eq('invitation_token', token)
      .maybeSingle();

    if (!app) return json({ valid: false, error: 'not_found' });
    if (app.invitation_used_at || app.user_id) return json({ valid: false, error: 'already_used' });
    if (app.invitation_expires_at && new Date(app.invitation_expires_at) < new Date()) {
      return json({ valid: false, error: 'expired' });
    }

    return json({
      valid: true,
      full_name: app.full_name,
      email: app.email,
    });
  } catch (err) {
    console.error('validate-consultant-invitation error:', err);
    return json({ valid: false, error: 'server_error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
