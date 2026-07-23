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

    const { data, error } = await admin
      .from('firm_applications')
      .select('id, legal_name, contact_name, contact_email, status, invitation_expires_at, activated_at, activated_user_id')
      .eq('invitation_token', token)
      .maybeSingle();

    if (error || !data) return json({ valid: false, error: 'not_found' }, 200);
    if (data.status !== 'accepted') return json({ valid: false, error: 'not_accepted' }, 200);
    if (data.activated_at || data.activated_user_id) return json({ valid: false, error: 'already_used' }, 200);
    if (data.invitation_expires_at && new Date(data.invitation_expires_at) < new Date()) {
      return json({ valid: false, error: 'expired' }, 200);
    }

    return json({
      valid: true,
      legal_name: data.legal_name,
      contact_name: data.contact_name,
      email: data.contact_email,
    });
  } catch (err) {
    return json({ valid: false, error: 'server_error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
