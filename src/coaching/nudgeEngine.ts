import AsyncStorage from '@react-native-async-storage/async-storage';
import { cyclePhaseForDate } from '../storage';
import { Episode, Lang, UserSettings } from '../types';
import { NUDGE_TEMPLATES, NudgeTemplate } from './nudgeTemplates';

const HISTORY_KEY = 'blooms_coaching_history';
const HISTORY_DAYS = 7;

export interface CoachingNudge {
  id: string;
  text: string;
  action: string;
  actionRoute?: string;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getCoachingNudge(
  episodes: Episode[],
  settings: UserSettings,
  lang: Lang,
): Promise<CoachingNudge | null> {
  const today = new Date().toISOString().split('T')[0];
  const recentIds = await loadRecentIds();
  const vars = buildVars(episodes, settings, lang, today);

  const candidate = pickCandidate(episodes, settings, vars, recentIds, today);
  if (!candidate) return null;

  await markShown(candidate.id, today, recentIds);

  return {
    id: candidate.id,
    text: candidate.text[lang](vars),
    action: candidate.action[lang],
    actionRoute: candidate.actionRoute,
  };
}

// ── Selection logic ───────────────────────────────────────────────────────────

function pickCandidate(
  episodes: Episode[],
  settings: UserSettings,
  vars: Record<string, string>,
  recentIds: Set<string>,
  today: string,
): NudgeTemplate | null {
  const cycleInfo  = cyclePhaseForDate(today, settings);
  const daysUntil  = settings.cycleLength - cycleInfo.dayOfCycle + 1;
  const daysSince  = Number(vars.daysSince);
  const streak     = Number(vars.streak);
  const dayOfCycle = cycleInfo.dayOfCycle;

  // 1. Period phase
  if (cycleInfo.phase === 'period') {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'phase_period'), recentIds);
    if (p) return p;
  }

  // 2. Pre-period window (≤6 days out) — actionable prep, higher priority than generic luteal
  if (daysUntil <= 6 && daysUntil > 0 && cycleInfo.phase !== 'period') {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'phase_pre'), recentIds);
    if (p) return p;
  }

  // 3. Ovulation
  if (cycleInfo.phase === 'ovulation') {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'phase_ovulation'), recentIds);
    if (p) return p;
  }

  // 4. Luteal (general phase)
  if (cycleInfo.phase === 'luteal') {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'phase_luteal'), recentIds);
    if (p) return p;
  }

  // 5. Pattern insights (need 10+ episodes for meaningful patterns)
  if (episodes.length >= 10) {
    // Specific high-value patterns first
    if (detectPrePeriodHeadache(episodes, settings) && !recentIds.has('pattern_headache_pre')) {
      const t = NUDGE_TEMPLATES.find(t => t.id === 'pattern_headache_pre');
      if (t) return t;
    }
    if (detectHeatPattern(episodes) && !recentIds.has('pattern_heat_works')) {
      const t = NUDGE_TEMPLATES.find(t => t.id === 'pattern_heat_works');
      if (t) return t;
    }
    if (detectMoodDipAhead(episodes, settings, today, dayOfCycle) && !recentIds.has('pattern_mood_dip')) {
      const t = NUDGE_TEMPLATES.find(t => t.id === 'pattern_mood_dip');
      if (t) return t;
    }
    // General patterns
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'pattern'), recentIds);
    if (p) return p;
  }

  // 6. Streak recognition (3+ consecutive days)
  if (streak >= 3) {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'streak'), recentIds);
    if (p) return p;
  }

  // 7. Re-engagement (3+ days without logging)
  if (daysSince >= 3) {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'reengagement'), recentIds);
    if (p) return p;
  }

  // 8. Fallback education
  const edu = pick(NUDGE_TEMPLATES.filter(t => t.category === 'education'), recentIds);
  if (edu) return edu;

  // All exhausted — reset history and start over
  AsyncStorage.setItem(HISTORY_KEY, '[]');
  return NUDGE_TEMPLATES.find(t => t.category === 'education') ?? NUDGE_TEMPLATES[0];
}

function pick(templates: NudgeTemplate[], recentIds: Set<string>): NudgeTemplate | null {
  return templates.find(t => !recentIds.has(t.id)) ?? null;
}

// ── Pattern detectors ─────────────────────────────────────────────────────────

/** True when headaches cluster in the last 3 days of the cycle across 3+ occurrences. */
function detectPrePeriodHeadache(episodes: Episode[], settings: UserSettings): boolean {
  const headacheEps = episodes.filter(e => e.symptoms.includes('headache' as any));
  if (headacheEps.length < 3) return false;
  const prePeriod = headacheEps.filter(e => {
    const d = cyclePhaseForDate(e.date, settings).dayOfCycle;
    return d >= settings.cycleLength - 3;
  });
  return prePeriod.length >= 3;
}

/** True when heat has been used as a relief method 2+ times. */
function detectHeatPattern(episodes: Episode[]): boolean {
  return episodes.filter(e => e.reliefMethods.includes('heat' as any)).length >= 2;
}

/**
 * True when today is cycle day 24–26 AND mood_swings appear on days 24–27
 * in past cycle data (at least 2 occurrences).
 */
function detectMoodDipAhead(
  episodes: Episode[],
  settings: UserSettings,
  today: string,
  dayOfCycle: number,
): boolean {
  if (dayOfCycle < 23 || dayOfCycle > 26) return false;
  const moodEps = episodes.filter(e => e.symptoms.includes('mood_swings' as any));
  if (moodEps.length < 2) return false;
  const onLutealDays = moodEps.filter(e => {
    const d = cyclePhaseForDate(e.date, settings).dayOfCycle;
    return d >= 24 && d <= 27;
  });
  return onLutealDays.length >= 2;
}

// ── Variable builder ──────────────────────────────────────────────────────────

function buildVars(
  episodes: Episode[],
  settings: UserSettings,
  lang: Lang,
  today: string,
): Record<string, string> {
  const cycleInfo  = cyclePhaseForDate(today, settings);
  const dayOfCycle = String(cycleInfo.dayOfCycle);
  const daysUntil  = String(Math.max(0, settings.cycleLength - cycleInfo.dayOfCycle + 1));

  const nextDate      = new Date(cycleInfo.nextPeriodDate + 'T12:00:00');
  const nextPeriodDay = DAY_NAMES[lang][nextDate.getDay()];

  const dates     = [...new Set(episodes.map(e => e.date))].sort();
  const streak    = String(calcCurrentStreak(dates, today));
  const lastLog   = dates[dates.length - 1];
  const daysSince = lastLog
    ? String(Math.round(
        (new Date(today + 'T12:00:00').getTime() - new Date(lastLog + 'T12:00:00').getTime()) / 86400000,
      ))
    : '7';

  const symCounts: Record<string, number> = {};
  for (const ep of episodes) for (const s of ep.symptoms) symCounts[s] = (symCounts[s] ?? 0) + 1;
  const topSym  = Object.entries(symCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  const symptom = SYMPTOM_NAMES[lang][topSym] ?? topSym;

  const painByDay: Record<number, number[]> = {};
  for (const ep of episodes) {
    const d = cyclePhaseForDate(ep.date, settings).dayOfCycle;
    (painByDay[d] ??= []).push(ep.painLevel);
  }
  const peakDay = String(
    Object.entries(painByDay)
      .map(([d, lvls]) => ({ d: Number(d), avg: lvls.reduce((a, b) => a + b, 0) / lvls.length }))
      .sort((a, b) => b.avg - a.avg)[0]?.d ?? cycleInfo.dayOfCycle,
  );

  return { _today: today, dayOfCycle, daysUntil, nextPeriodDay, streak, daysSince, symptom, peakDay };
}

// ── History helpers ───────────────────────────────────────────────────────────

async function loadRecentIds(): Promise<Set<string>> {
  try {
    const raw     = await AsyncStorage.getItem(HISTORY_KEY);
    const history: { id: string; date: string }[] = raw ? JSON.parse(raw) : [];
    const cutoff  = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString().split('T')[0];
    return new Set(history.filter(h => h.date >= cutoff).map(h => h.id));
  } catch {
    return new Set();
  }
}

async function markShown(id: string, today: string, _existing: Set<string>): Promise<void> {
  try {
    const raw     = await AsyncStorage.getItem(HISTORY_KEY);
    const history: { id: string; date: string }[] = raw ? JSON.parse(raw) : [];
    const cutoff  = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString().split('T')[0];
    const pruned  = history.filter(h => h.date >= cutoff && h.id !== id);
    pruned.push({ id, date: today });
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(pruned));
  } catch {
    // ignore
  }
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function calcCurrentStreak(sortedDates: string[], today: string): number {
  if (!sortedDates.length) return 0;
  const last         = sortedDates[sortedDates.length - 1];
  const daysSinceLast = Math.round(
    (new Date(today + 'T12:00:00').getTime() - new Date(last + 'T12:00:00').getTime()) / 86400000,
  );
  if (daysSinceLast > 1) return 0;
  let streak = 1;
  for (let i = sortedDates.length - 2; i >= 0; i--) {
    const a   = new Date(sortedDates[i + 1] + 'T12:00:00');
    const b   = new Date(sortedDates[i]     + 'T12:00:00');
    const gap = Math.round((a.getTime() - b.getTime()) / 86400000);
    if (gap === 1) streak++;
    else break;
  }
  return streak;
}

const DAY_NAMES: Record<Lang, string[]> = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const SYMPTOM_NAMES: Record<Lang, Record<string, string>> = {
  uz: {
    bloating: 'shishish', headache: "bosh og'rig'i", nausea: "ko'ngil aynishi",
    fatigue: 'charchoq', mood_swings: "kayfiyat o'zgarishi", breast_tenderness: "ko'krak og'rig'i",
  },
  ru: {
    bloating: 'вздутие', headache: 'головная боль', nausea: 'тошнота',
    fatigue: 'усталость', mood_swings: 'перепады настроения', breast_tenderness: 'болезненность груди',
  },
  en: {
    bloating: 'bloating', headache: 'headache', nausea: 'nausea',
    fatigue: 'fatigue', mood_swings: 'mood swings', breast_tenderness: 'breast tenderness',
  },
};
