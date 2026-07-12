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

  const candidate = pickCandidate(episodes, settings, vars, recentIds);
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
): NudgeTemplate | null {
  const cycleInfo = cyclePhaseForDate(vars._today, settings);
  const daysUntil = settings.cycleLength - cycleInfo.dayOfCycle + 1;
  const daysSince = Number(vars.daysSince);
  const streak = Number(vars.streak);

  // 1. Phase-aware (highest priority)
  if (cycleInfo.phase === 'period') {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'phase_period'), recentIds);
    if (p) return p;
  }
  if (daysUntil <= 3 && daysUntil > 0 && cycleInfo.phase !== 'period') {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'phase_pre'), recentIds);
    if (p) return p;
  }
  if (cycleInfo.phase === 'ovulation') {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'phase_ovulation'), recentIds);
    if (p) return p;
  }
  if (cycleInfo.phase === 'luteal') {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'phase_luteal'), recentIds);
    if (p) return p;
  }

  // 2. Pattern insight (need 10+ episodes)
  if (episodes.length >= 10) {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'pattern'), recentIds);
    if (p) return p;
  }

  // 3. Streak recognition (3+ days)
  if (streak >= 3) {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'streak'), recentIds);
    if (p) return p;
  }

  // 4. Re-engagement (3+ days since last log)
  if (daysSince >= 3) {
    const p = pick(NUDGE_TEMPLATES.filter(t => t.category === 'reengagement'), recentIds);
    if (p) return p;
  }

  // 5. Fallback education
  const edu = pick(NUDGE_TEMPLATES.filter(t => t.category === 'education'), recentIds);
  if (edu) return edu;

  // All categories exhausted — reset history and pick first education
  AsyncStorage.setItem(HISTORY_KEY, '[]');
  return NUDGE_TEMPLATES.find(t => t.category === 'education') ?? NUDGE_TEMPLATES[0];
}

function pick(templates: NudgeTemplate[], recentIds: Set<string>): NudgeTemplate | null {
  const available = templates.filter(t => !recentIds.has(t.id));
  return available[0] ?? null;
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

  const nextDate = new Date(cycleInfo.nextPeriodDate + 'T12:00:00');
  const nextPeriodDay = DAY_NAMES[lang][nextDate.getDay()];

  const dates = [...new Set(episodes.map(e => e.date))].sort();
  const streak = String(calcCurrentStreak(dates, today));

  const lastLog    = dates[dates.length - 1];
  const daysSince  = lastLog
    ? String(Math.round((new Date(today + 'T12:00:00').getTime() - new Date(lastLog + 'T12:00:00').getTime()) / 86400000))
    : '7';

  // Top symptom name in lang
  const symCounts: Record<string, number> = {};
  for (const ep of episodes) for (const s of ep.symptoms) symCounts[s] = (symCounts[s] ?? 0) + 1;
  const topSym = Object.entries(symCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  const symptom = SYMPTOM_NAMES[lang][topSym] ?? topSym;

  // Peak pain day of cycle
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
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const history: { id: string; date: string }[] = raw ? JSON.parse(raw) : [];
    const cutoff = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString().split('T')[0];
    return new Set(history.filter(h => h.date >= cutoff).map(h => h.id));
  } catch {
    return new Set();
  }
}

async function markShown(id: string, today: string, existing: Set<string>): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const history: { id: string; date: string }[] = raw ? JSON.parse(raw) : [];
    const cutoff = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString().split('T')[0];
    const pruned = history.filter(h => h.date >= cutoff && h.id !== id);
    pruned.push({ id, date: today });
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(pruned));
  } catch {
    // ignore
  }
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function calcCurrentStreak(sortedDates: string[], today: string): number {
  if (!sortedDates.length) return 0;
  const last = sortedDates[sortedDates.length - 1];
  const daysSinceLast = Math.round(
    (new Date(today + 'T12:00:00').getTime() - new Date(last + 'T12:00:00').getTime()) / 86400000,
  );
  if (daysSinceLast > 1) return 0;
  let streak = 1;
  for (let i = sortedDates.length - 2; i >= 0; i--) {
    const a = new Date(sortedDates[i + 1] + 'T12:00:00');
    const b = new Date(sortedDates[i]     + 'T12:00:00');
    if (Math.round((a.getTime() - b.getTime()) / 86400000) === 1) streak++;
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
  uz: { bloating: 'shishish', headache: "bosh og'rig'i", nausea: "ko'ngil aynishi", fatigue: 'charchoq', mood_swings: "kayfiyat o'zgarishi", breast_tenderness: "ko'krak og'rig'i" },
  ru: { bloating: 'вздутие', headache: 'головная боль', nausea: 'тошнота', fatigue: 'усталость', mood_swings: 'перепады настроения', breast_tenderness: 'болезненность груди' },
  en: { bloating: 'bloating', headache: 'headache', nausea: 'nausea', fatigue: 'fatigue', mood_swings: 'mood swings', breast_tenderness: 'breast tenderness' },
};
