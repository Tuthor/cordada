import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const LeaderSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  position: z.string().trim().max(120).optional().default(''),
  email: z.string().trim().email().max(160),
  linkedin: z.string().trim().max(255).optional().default(''),
});

const BodySchema = z.object({
  legal_name: z.string().trim().min(2).max(200),
  rut: z.string().trim().max(20).optional().default(''),
  website: z.string().trim().max(255).optional().default(''),
  founded_year: z.number().int().min(1900).max(2100).optional().nullable(),
  contact_name: z.string().trim().min(2).max(160),
  contact_position: z.string().trim().max(120).optional().default(''),
  contact_email: z.string().trim().email().max(160),
  contact_phone: z.string().trim().max(40).optional().default(''),
  size_consultants: z.number().int().min(0).max(100000).optional().nullable(),
  size_partners: z.number().int().min(0).max(10000).optional().nullable(),
  annual_revenue_uf: z.string().trim().max(60).optional().default(''),
  sectors: z.array(z.string().trim().max(80)).max(30).optional().default([]),
  practice_areas: z.array(z.string().trim().max(80)).max(30).optional().default([]),
  key_clients: z.string().trim().max(2000).optional().default(''),
  certifications: z.string().trim().max(2000).optional().default(''),
  maturity_answers: z.record(z.string(), z.number().min(1).max(5)),
  accepted_code_of_conduct: z.literal(true),
  accepted_data_consent: z.literal(true),
  leaders: z.array(LeaderSchema).min(1).max(10),
  base_url: z.string().url(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const b = parsed.data;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const answers = b.maturity_answers;
    const values = Object.values(answers);
    const overall = values.length ? values.reduce((a, x) => a + x, 0) / values.length : 0;

    const now = new Date().toISOString();

    const { data: appRow, error: insErr } = await admin
      .from('firm_applications')
      .insert({
        legal_name: b.legal_name,
        rut: b.rut || null,
        website: b.website || null,
        founded_year: b.founded_year ?? null,
        contact_name: b.contact_name,
        contact_position: b.contact_position || null,
        contact_email: b.contact_email,
        contact_phone: b.contact_phone || null,
        size_consultants: b.size_consultants ?? null,
        size_partners: b.size_partners ?? null,
        annual_revenue_uf: b.annual_revenue_uf || null,
        sectors: b.sectors,
        practice_areas: b.practice_areas,
        key_clients: b.key_clients || null,
        certifications: b.certifications || null,
        maturity_answers: answers,
        maturity_scores: answers,
        maturity_overall: Number(overall.toFixed(2)),
        status: 'pending',
        accepted_code_of_conduct: true,
        accepted_data_consent: true,
        consent_accepted_at: now,
      })
      .select('id')
      .single();

    if (insErr || !appRow) return json({ error: insErr?.message || 'insert_failed' }, 500);

    const base = b.base_url.replace(/\/$/, '');
    const leadersPayload = b.leaders.map((l) => ({
      firm_application_id: appRow.id,
      full_name: l.full_name,
      position: l.position || null,
      email: l.email,
      linkedin: l.linkedin || null,
      leader_token: crypto.randomUUID(),
    }));

    const { data: leaders, error: ldErr } = await admin
      .from('firm_application_leaders')
      .insert(leadersPayload)
      .select('id, full_name, position, email, leader_token');

    if (ldErr) return json({ error: ldErr.message }, 500);

    const links = (leaders || []).map((l) => ({
      id: l.id,
      full_name: l.full_name,
      position: l.position,
      email: l.email,
      url: `${base}/evaluacion-consultor?firm_token=${appRow.id}&leader=${l.leader_token}`,
    }));

    return json({ success: true, application_id: appRow.id, leaders: links });
  } catch (err) {
    console.error('submit-firm-application error:', err);
    return json({ error: err instanceof Error ? err.message : 'server_error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
