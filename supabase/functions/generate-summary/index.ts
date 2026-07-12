import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsOk, json } from '../_shared/cors.ts';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM = `You are a health analyst for Blooms, a menstrual pain tracking app.
Generate a {PERIOD} report in {LANG} based on the user's tracking data.
Respond ONLY with valid JSON — no markdown, no code fences:
{
  "headline": "one sentence summary",
  "highlights": ["specific finding 1", "finding 2", "finding 3"],
  "suggestions": ["actionable tip 1", "tip 2"],
  "trend": "improving" | "stable" | "worsening"
}
Max 3 highlights, 2 suggestions. Be warm, specific, data-driven. Never alarming.`;

const LANG_NAME: Record<string, string> = { uz: 'Uzbek', ru: 'Russian', en: 'English' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsOk();

  // Fail fast if any required env var is missing
  const supabaseUrl  = Deno.env.get('SUPABASE_URL');
  const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey      = Deno.env.get('SUPABASE_ANON_KEY');
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!supabaseUrl || !serviceKey || !anonKey || !anthropicKey) {
    return json({ error: 'misconfigured' }, 500);
  }

  try {

    const body      = await req.json().catch(() => ({}));
    const scheduled = body.scheduled === true;
    const force     = body.force === true;

    // Validate period and language inputs
    const VALID_PERIODS = new Set(['weekly', 'monthly']);
    const VALID_LANGS   = new Set(['uz', 'ru', 'en']);
    const rawPeriod = body.period ?? 'weekly';
    const rawLang   = body.language ?? 'en';
    if (!VALID_PERIODS.has(rawPeriod)) return json({ error: 'invalid_period' }, 400);
    if (!VALID_LANGS.has(rawLang))     return json({ error: 'invalid_language' }, 400);
    const period = rawPeriod as 'weekly' | 'monthly';
    const lang   = rawLang as string;

    const admin = createClient(supabaseUrl, serviceKey);

    // ── Scheduled cron path: generate for all active users ────────────────────
    if (scheduled) {
      // Require a shared secret so this path can't be triggered anonymously
      const cronSecret = Deno.env.get('CRON_SECRET');
      const provided   = req.headers.get('x-cron-secret');
      if (!cronSecret || provided !== cronSecret) {
        return json({ error: 'unauthorized' }, 401);
      }
      const { data: users } = await admin
        .from('user_settings')
        .select('user_id, language');

      const results = await Promise.allSettled(
        (users ?? []).map((u: any) =>
          generateForUser(u.user_id, period, u.language ?? 'en', admin, anthropicKey, false)
        )
      );
      const ok = results.filter(r => r.status === 'fulfilled').length;
      return json({ ok: true, processed: ok, total: users?.length ?? 0 });
    }

    // ── User-triggered path ───────────────────────────────────────────────────
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'unauthorized' }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: 'unauthorized' }, 401);

    // Rate limit: 1 on-demand regenerate per day (unless force=true)
    if (!force) {
      const dayStart = new Date();
      dayStart.setUTCHours(0, 0, 0, 0);
      const { data: generated } = await admin
        .from('ai_summaries')
        .select('id')
        .eq('user_id', user.id)
        .eq('period', period)
        .gte('created_at', dayStart.toISOString())
        .maybeSingle();

      const { start } = periodBounds(period);
      if (generated) {
        // Already generated today — return existing for this period
        const { data: existing } = await admin
          .from('ai_summaries')
          .select('*')
          .eq('user_id', user.id)
          .eq('period', period)
          .eq('period_start', start)
          .maybeSingle();
        if (existing) return json({ summary: existing, cached: true });
      }
    }

    const summary = await generateForUser(user.id, period, lang, admin, anthropicKey, force);
    if (!summary) return json({ error: 'not_enough_data' }, 422);
    return json({ summary });

  } catch (err) {
    console.error('generate-summary:', err);
    return json({ error: 'internal_error' }, 500);
  }
});

// ── Core generation logic ─────────────────────────────────────────────────────

async function generateForUser(
  userId: string,
  period: 'weekly' | 'monthly',
  lang: string,
  admin: ReturnType<typeof createClient>,
  anthropicKey: string,
  force: boolean,
) {
  const { start, end, totalDays } = periodBounds(period);

  // Return cached if not forcing
  if (!force) {
    const { data: cached } = await admin
      .from('ai_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('period', period)
      .eq('period_start', start)
      .maybeSingle();
    if (cached) return cached;
  }

  // Fetch this-period episodes
  const { data: eps } = await admin
    .from('episodes')
    .select('date,pain_level,symptoms,relief_methods,timestamp')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end);

  if (!eps?.length) return null;

  // Fetch previous period for trend comparison
  const prevEndDate   = new Date(start + 'T00:00:00Z');
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - totalDays + 1);

  const { data: prevEps } = await admin
    .from('episodes')
    .select('pain_level')
    .eq('user_id', userId)
    .gte('date', prevStartDate.toISOString().split('T')[0])
    .lte('date', prevEndDate.toISOString().split('T')[0]);

  // Build stats
  const uniqueDates = [...new Set(eps.map((e: any) => e.date))];
  const avgPain  = +(eps.reduce((s: number, e: any) => s + e.pain_level, 0) / eps.length).toFixed(1);
  const prevAvg  = prevEps?.length
    ? +(prevEps.reduce((s: number, e: any) => s + e.pain_level, 0) / prevEps.length).toFixed(1)
    : null;

  const symCounts: Record<string, number>    = {};
  const reliefCounts: Record<string, number> = {};
  const painByDate: Record<string, number[]> = {};

  for (const ep of eps) {
    for (const s of ep.symptoms ?? [])      symCounts[s]    = (symCounts[s] ?? 0) + 1;
    for (const r of ep.relief_methods ?? []) reliefCounts[r] = (reliefCounts[r] ?? 0) + 1;
    (painByDate[ep.date] ??= []).push(ep.pain_level);
  }

  const peakDay = Object.entries(painByDate)
    .map(([date, levels]) => ({ date, max: Math.max(...levels) }))
    .sort((a, b) => b.max - a.max)[0];

  const topSymptoms = Object.entries(symCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / eps.length) * 100) }));

  const topRelief = Object.entries(reliefCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  const stats = {
    period, period_start: start, period_end: end,
    days_logged:      uniqueDates.length,
    total_days:       totalDays,
    consistency_pct:  Math.round((uniqueDates.length / totalDays) * 100),
    avg_pain:         avgPain,
    prev_avg_pain:    prevAvg,
    peak_pain_day:    peakDay?.date ?? null,
    peak_pain_level:  peakDay?.max ?? null,
    top_symptoms:     topSymptoms,
    top_relief:       topRelief,
  };

  // Call Claude
  const systemPrompt = SYSTEM
    .replace('{PERIOD}', period)
    .replace(/{LANG}/g, LANG_NAME[lang] ?? 'English');

  const userPrompt = `${period} tracking data:\n${JSON.stringify(stats, null, 2)}\n\nWrite the report in ${LANG_NAME[lang] ?? 'English'}.`;

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!claudeRes.ok) throw new Error(`Claude ${claudeRes.status}`);
  const claudeData = await claudeRes.json();

  let raw = (claudeData.content?.[0]?.text ?? '').trim();
  raw = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

  let aiContent: Record<string, unknown>;
  try {
    aiContent = JSON.parse(raw);
  } catch {
    aiContent = { headline: raw, highlights: [], suggestions: [], trend: 'stable' };
  }

  // Embed stats so client can render charts without a second query
  aiContent.stats = stats;

  const { data: summary, error } = await admin
    .from('ai_summaries')
    .upsert(
      { user_id: userId, period, period_start: start, period_end: end, content: aiContent, language: lang },
      { onConflict: 'user_id,period,period_start' }
    )
    .select()
    .single();

  if (error) throw error;
  return summary;
}

// ── Period helpers ────────────────────────────────────────────────────────────

function periodBounds(period: 'weekly' | 'monthly'): { start: string; end: string; totalDays: number } {
  const now = new Date();

  if (period === 'weekly') {
    // Last complete Mon–Sun week
    const dow    = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dow + 6) % 7) - 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: toDate(monday), end: toDate(sunday), totalDays: 7 };
  }

  // Last complete calendar month
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfPrev  = new Date(first.getTime() - 1);
  const firstOfPrev = new Date(lastOfPrev.getFullYear(), lastOfPrev.getMonth(), 1);
  return { start: toDate(firstOfPrev), end: toDate(lastOfPrev), totalDays: lastOfPrev.getDate() };
}

const toDate = (d: Date) => d.toISOString().split('T')[0];
