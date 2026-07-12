import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsOk, json } from '../_shared/cors.ts';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM = `You are a warm, supportive health coach for Blooms, a menstrual pain tracking app.
Generate a short personalized nudge based on the user's tracking data.
Respond ONLY with valid JSON — no markdown, no code fences, just raw JSON:
{"type":"streak"|"consistency"|"pattern"|"suggestion","message":"2-3 warm, specific sentences in {LANG}"}
Tone: kind, encouraging, never alarming. Be concrete about the numbers in the data.`;

const LANG_NAME: Record<string, string> = { uz: 'Uzbek', ru: 'Russian', en: 'English' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsOk();

  try {
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey      = Deno.env.get('SUPABASE_ANON_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    // ── Auth ──────────────────────────────────────────────────────────────────
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'unauthorized' }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: 'unauthorized' }, 401);

    const userId = user.id;
    const admin  = createClient(supabaseUrl, serviceKey);

    // ── Rate limit: 1 nudge per calendar day ──────────────────────────────────
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);

    const { data: existing } = await admin
      .from('ai_nudges')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', dayStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return json({ nudge: existing });

    // ── Fetch user data ───────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const lang = (body.language ?? 'en') as string;
    const ago30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const [{ data: eps }, { data: challenges }, { data: settings }] = await Promise.all([
      admin.from('episodes')
        .select('date,pain_level,symptoms,relief_methods')
        .eq('user_id', userId)
        .gte('date', ago30)
        .order('date', { ascending: false }),
      admin.from('challenges')
        .select('challenge_id,logged_dates,completed')
        .eq('user_id', userId),
      admin.from('user_settings')
        .select('period_active,last_period_start,cycle_length')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (!eps?.length) return json({ error: 'not_enough_data' }, 422);

    // ── Build stats payload ───────────────────────────────────────────────────
    const uniqueDates = [...new Set(eps.map((e: any) => e.date))];
    const avgPain = +(eps.reduce((s: number, e: any) => s + e.pain_level, 0) / eps.length).toFixed(1);

    const symCounts: Record<string, number> = {};
    const reliefCounts: Record<string, number> = {};
    for (const ep of eps) {
      for (const s of ep.symptoms ?? []) symCounts[s] = (symCounts[s] ?? 0) + 1;
      for (const r of ep.relief_methods ?? []) reliefCounts[r] = (reliefCounts[r] ?? 0) + 1;
    }

    const topSymptoms = Object.entries(symCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
    const topRelief   = Object.entries(reliefCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
    const currentStreak = calcCurrentStreak(uniqueDates as string[]);

    const stats = {
      days_logged_last_30:        uniqueDates.length,
      consistency_pct:            Math.round((uniqueDates.length / 30) * 100),
      current_streak_days:        currentStreak,
      avg_pain_level:             avgPain,
      top_symptoms:               topSymptoms,
      top_relief_methods:         topRelief,
      seven_day_challenge_done:   challenges?.find((c: any) => c.challenge_id === '7day')?.completed ?? false,
      period_active:              settings?.data?.period_active ?? false,
    };

    // ── Call Claude ───────────────────────────────────────────────────────────
    const systemPrompt = SYSTEM.replace('{LANG}', LANG_NAME[lang] ?? 'English');
    const userPrompt   = `User data (last 30 days):\n${JSON.stringify(stats, null, 2)}\n\nWrite the nudge in ${LANG_NAME[lang] ?? 'English'}.`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!claudeRes.ok) throw new Error(`Claude ${claudeRes.status}: ${await claudeRes.text()}`);
    const claudeData = await claudeRes.json();

    let raw = (claudeData.content?.[0]?.text ?? '').trim();
    raw = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed: { type: string; message: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { type: 'general', message: raw };
    }

    // ── Store & return ────────────────────────────────────────────────────────
    const { data: nudge, error: insertErr } = await admin
      .from('ai_nudges')
      .insert({ user_id: userId, type: parsed.type ?? 'general', content: parsed.message, language: lang })
      .select()
      .single();

    if (insertErr) throw insertErr;
    return json({ nudge });

  } catch (err) {
    console.error('generate-nudge:', err);
    return json({ error: 'internal_error' }, 500);
  }
});

function calcCurrentStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  const today  = new Date().toISOString().split('T')[0];
  if (sorted[0] !== today) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1] + 'T12:00:00');
    const b = new Date(sorted[i]     + 'T12:00:00');
    if (Math.round((a.getTime() - b.getTime()) / 86400000) === 1) streak++;
    else break;
  }
  return streak;
}
