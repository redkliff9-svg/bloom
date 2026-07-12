/**
 * Dev-only seed data for testing the coaching engine, predictions, and AI summaries.
 * Never import this in production paths — all exports are only used behind __DEV__ checks.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Episode, FlowIntensity, PainLocation, ReliefMethod, Symptom, UserSettings } from '../types';

const STORAGE_KEYS = {
  episodes:      'blooms_episodes',
  settings:      'blooms_settings',
  challenges:    'blooms_challenges',
  coachHistory:  'blooms_coaching_history',
  nudgeHistory:  'blooms_nudge_history',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function toDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function ts(d: Date, hour: number): number {
  const t = new Date(d);
  t.setHours(hour, 0, 0, 0);
  return t.getTime();
}

let _id = 0;
function id(prefix = 'seed'): string {
  return `${prefix}_${++_id}_${Date.now()}`;
}

interface EpArgs {
  date: Date;
  hour: number;
  type?: 'episode' | 'daily';
  painLevel: number;
  painLocations?: PainLocation[];
  symptoms?: Symptom[];
  reliefMethods?: ReliefMethod[];
  flow?: FlowIntensity;
  notes?: string;
}

function ep(args: EpArgs): Episode {
  return {
    id: id(),
    type: args.type ?? 'episode',
    date: toDate(args.date),
    timestamp: ts(args.date, args.hour),
    painLevel: args.painLevel,
    painLocations: args.painLocations ?? [],
    symptoms: args.symptoms ?? [],
    reliefMethods: args.reliefMethods ?? ['none'],
    flow: args.flow,
    notes: args.notes ?? '',
  };
}

// ── Period day episode generator ──────────────────────────────────────────────

function periodDayEps(
  cycleStart: Date,
  day: number,          // 1-based cycle day
  cycleNum: 1 | 2 | 3 | 4 | 5,
): Episode[] {
  const date       = addDays(cycleStart, day - 1);
  const hasNausea  = day === 1 && cycleNum !== 4;     // nausea on day 1, not cycle 4
  const useHeat    = (cycleNum === 3 || cycleNum === 4) && day === 1;
  const peakPain   = cycleNum <= 3 ? 8 : 7;           // cycle 4 slightly milder
  const painLevel  = day <= 2 ? peakPain : day === 3 ? 4 : day === 4 ? 3 : 1;
  const flow: FlowIntensity =
    day === 1 ? 'heavy' : day === 2 ? 'heavy' : day === 3 ? 'medium' : day === 4 ? 'light' : 'spotting';

  const morning = ep({
    date,
    hour: 8,
    painLevel,
    painLocations: day <= 3
      ? ['lower_abdomen', 'lower_back']
      : ['lower_abdomen'],
    symptoms: [
      ...(hasNausea           ? ['nausea']   : []) as Symptom[],
      ...(day <= 3            ? ['fatigue']  : []) as Symptom[],
      ...(day <= 2            ? ['bloating'] : []) as Symptom[],
    ],
    reliefMethods: [
      ...(useHeat  ? ['heat']       : []) as ReliefMethod[],
      ...(day <= 3 ? ['medication'] : ['rest']) as ReliefMethod[],
    ],
    flow,
    notes: useHeat ? "Issiq yostiqcha tayyorladim" : '',
  });

  const eps: Episode[] = [morning];

  // Cycle 4 day 1: evening episode with lower pain proving heat worked
  if (cycleNum === 4 && day === 1) {
    eps.push(ep({
      date,
      hour: 19,
      painLevel: 4,
      painLocations: ['lower_abdomen'],
      symptoms: ['fatigue'],
      reliefMethods: ['heat', 'rest'],
      flow: 'heavy',
      notes: "Kechqurun issiqdan keyin og'riq ancha kamaydi",
    }));
  }

  return eps;
}

// ── Full-history seed ─────────────────────────────────────────────────────────

/**
 * Populates 4 complete cycles + 20 days of cycle 5 (today = cycle day 24).
 *
 * Detectable patterns baked in:
 *  - Cramps: peak days 1–2 severity 7–8, tapers to 1 by day 5
 *  - Headaches: cycle days cycleLength-2, -1, 0 (last 3 days each cycle)
 *  - Mood swings: cycle days 25–26 each cycle
 *  - Nausea: day 1 of cycles 1, 2, 3 (not cycle 4)
 *  - Heat therapy: cycle 3 day 1 (morning) + cycle 4 day 1 (morning + lower evening)
 *  - 3-day logging gap ending 4 days ago → re-engagement nudge eligible
 *  - ~78% logging consistency in last 18 days
 */
export async function generateSeedHistory(): Promise<void> {
  _id = 0;

  const now     = new Date();
  now.setHours(12, 0, 0, 0);
  const today   = toDate(now);

  // Cycle start dates (today = cycle 5, day 24)
  const c5Start = addDays(now, -23);   // cycle 5: length 29 (ongoing)
  const c4Start = addDays(c5Start, -29); // cycle 4 length 29
  const c3Start = addDays(c4Start, -30); // cycle 3 length 30
  const c2Start = addDays(c3Start, -28); // cycle 2 length 28
  const c1Start = addDays(c2Start, -29); // cycle 1 length 29

  const settings: UserSettings = {
    language: 'uz',
    cycleLength: 29,
    periodLength: 5,
    lastPeriodStart: toDate(c5Start),
    notificationsEnabled: false,
    onboardingCompleted: true,
    reminderTime: '21:00',
    periodActive: false,
    theme: 'system',
    discreetNotifications: true,
  };

  const episodes: Episode[] = [
    // ── Cycle 1 (length 29, ~60% logging) ──────────────────────────────────
    ...buildCycle(c1Start, 29, 1,
      // period days
      [1, 2, 3, 4, 5],
      // regular check-in days (skips to simulate ~60%)
      [7, 9, 12, 15, 18, 21, 22],
      // mood days
      [25, 26],
      // headache days: length-2, length-1, length (27,28,29)
    ),

    // ── Cycle 2 (length 28, ~58% logging) ──────────────────────────────────
    ...buildCycle(c2Start, 28, 2,
      [1, 2, 3, 4, 5],
      [6, 9, 12, 15, 17, 21],
      [25, 26],
    ),

    // ── Cycle 3 (length 30, ~67% logging) ──────────────────────────────────
    ...buildCycle(c3Start, 30, 3,
      [1, 2, 3, 4, 5],
      [7, 9, 11, 14, 16, 18, 20, 22, 24],
      [25, 26],
    ),

    // ── Cycle 4 (length 29, ~72% logging) ──────────────────────────────────
    ...buildCycle(c4Start, 29, 4,
      [1, 2, 3, 4, 5],
      [6, 8, 10, 12, 14, 16, 18, 20, 22, 24],
      [25, 26],
    ),

    // ── Cycle 5 (current, days 1-20 only; gap at 21-23; today=24 unseeded) ─
    ...cycle5Episodes(c5Start),
  ];

  // Sort newest-first (as the app expects)
  episodes.sort((a, b) => b.timestamp - a.timestamp);

  await AsyncStorage.multiSet([
    [STORAGE_KEYS.episodes,     JSON.stringify(episodes)],
    [STORAGE_KEYS.settings,     JSON.stringify(settings)],
    [STORAGE_KEYS.coachHistory, '[]'],
    [STORAGE_KEYS.nudgeHistory, '[]'],
  ]);

  console.log(`[seed] Generated ${episodes.length} episodes across 4 complete cycles + cycle 5 (days 1–20).`);
  console.log(`[seed] Today = cycle day 24. Next period in ~6 days. daysSince last log = 4.`);
}

// ── Sparse history seed ───────────────────────────────────────────────────────

/**
 * 1 partial cycle with 5 scattered logs — tests graceful degradation
 * when data is too thin for pattern detection.
 */
export async function generateSparseHistory(): Promise<void> {
  _id = 0;

  const now   = new Date();
  now.setHours(12, 0, 0, 0);

  const c1Start = addDays(now, -10); // started 10 days ago, today = day 11

  const settings: UserSettings = {
    language: 'uz',
    cycleLength: 29,
    periodLength: 5,
    lastPeriodStart: toDate(c1Start),
    notificationsEnabled: false,
    onboardingCompleted: true,
    reminderTime: '21:00',
    periodActive: false,
    theme: 'system',
    discreetNotifications: true,
  };

  const episodes: Episode[] = [
    ep({ date: addDays(c1Start, 0),  hour: 9,  painLevel: 7, painLocations: ['lower_abdomen'], symptoms: ['bloating'],  reliefMethods: ['medication'], flow: 'heavy' }),
    ep({ date: addDays(c1Start, 1),  hour: 10, painLevel: 8, painLocations: ['lower_abdomen', 'lower_back'], symptoms: ['fatigue'], reliefMethods: ['heat'], flow: 'heavy' }),
    ep({ date: addDays(c1Start, 3),  hour: 11, painLevel: 3, painLocations: ['lower_abdomen'], symptoms: [],           reliefMethods: ['rest'], flow: 'light', type: 'daily' }),
    ep({ date: addDays(c1Start, 6),  hour: 20, painLevel: 1, painLocations: [],               symptoms: [],           reliefMethods: ['none'], type: 'daily' }),
    ep({ date: addDays(c1Start, 9),  hour: 9,  painLevel: 2, painLocations: [],               symptoms: ['fatigue'],  reliefMethods: ['rest'], type: 'daily' }),
  ];

  episodes.sort((a, b) => b.timestamp - a.timestamp);

  await AsyncStorage.multiSet([
    [STORAGE_KEYS.episodes,     JSON.stringify(episodes)],
    [STORAGE_KEYS.settings,     JSON.stringify(settings)],
    [STORAGE_KEYS.coachHistory, '[]'],
    [STORAGE_KEYS.nudgeHistory, '[]'],
  ]);

  console.log(`[seed] Sparse: ${episodes.length} episodes. Engine will fall through to education nudges.`);
}

// ── Clear all data ────────────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  console.log('[seed] All data cleared.');
}

// ── Internal builders ─────────────────────────────────────────────────────────

function buildCycle(
  cycleStart: Date,
  cycleLength: number,
  cycleNum: 1 | 2 | 3 | 4,
  periodDays: number[],
  regularDays: number[],
  moodDays: number[],
): Episode[] {
  const eps: Episode[] = [];
  const headacheDays = [cycleLength - 2, cycleLength - 1, cycleLength];

  // Period days
  for (const day of periodDays) {
    eps.push(...periodDayEps(cycleStart, day, cycleNum));
  }

  // Regular check-in days
  for (const day of regularDays) {
    if (periodDays.includes(day) || moodDays.includes(day) || headacheDays.includes(day)) continue;
    eps.push(ep({
      date: addDays(cycleStart, day - 1),
      hour: 20,
      type: 'daily',
      painLevel: 1,
      symptoms: [],
      reliefMethods: ['none'],
    }));
  }

  // Mood days (25–26): mood_swings + fatigue, low pain
  for (const day of moodDays) {
    if (headacheDays.includes(day)) {
      // Overlap: log both mood and headache on same episode
      const severity = 5;
      eps.push(ep({
        date: addDays(cycleStart, day - 1),
        hour: 18,
        painLevel: severity,
        symptoms: ['mood_swings', 'headache'],
        reliefMethods: ['medication', 'rest'],
      }));
    } else {
      eps.push(ep({
        date: addDays(cycleStart, day - 1),
        hour: 18,
        painLevel: 2,
        symptoms: ['mood_swings', 'fatigue'],
        reliefMethods: ['rest'],
      }));
    }
  }

  // Headache days: last 3 days of cycle (different severities)
  const HEADACHE_SEVERITY = [5, 6, 4]; // day -2: 5, day -1: 6, day 0: 4
  for (let i = 0; i < headacheDays.length; i++) {
    const day = headacheDays[i];
    if (moodDays.includes(day)) continue; // already logged above with combo
    eps.push(ep({
      date: addDays(cycleStart, day - 1),
      hour: 9,
      painLevel: HEADACHE_SEVERITY[i],
      symptoms: ['headache'],
      reliefMethods: ['medication'],
    }));
  }

  return eps;
}

function cycle5Episodes(c5Start: Date): Episode[] {
  const eps: Episode[] = [];

  // Period days 1–5 (always logged)
  for (const day of [1, 2, 3, 4, 5]) {
    eps.push(...periodDayEps(c5Start, day, 5 as any));
  }

  // Days 6–20 logged (gap at 21, 22, 23; day 24 = today, not seeded)
  // Skip day 10 and 14 for realistic ~78% consistency
  const c5Regular = [6, 7, 8, 9, 11, 12, 13, 15, 16, 17, 18, 19, 20];
  for (const day of c5Regular) {
    eps.push(ep({
      date: addDays(c5Start, day - 1),
      hour: 20,
      type: 'daily',
      painLevel: 1,
      symptoms: [],
      reliefMethods: ['none'],
    }));
  }

  return eps;
}
