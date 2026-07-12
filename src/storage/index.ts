import AsyncStorage from '@react-native-async-storage/async-storage';
import { Challenge, Episode, FamilyMember, UserSettings } from '../types';
import { pushEpisode, pushDelete, pushSettings, pushChallenges } from './sync';

const KEYS = {
  episodes:       'blooms_episodes',
  challenges:     'blooms_challenges',
  settings:       'blooms_settings',
  familyMembers:  'blooms_family_members',
  activeMemberId: 'blooms_active_member_id',
} as const;

// Set by AuthContext when a user logs in / out
let _userId: string | null = null;
export function setCurrentUser(id: string | null) { _userId = id; }

// ─── Episodes ────────────────────────────────────────────────────────────────

export async function getEpisodes(): Promise<Episode[]> {
  const raw = await AsyncStorage.getItem(KEYS.episodes);
  return raw ? JSON.parse(raw) : [];
}

export async function saveEpisode(ep: Episode): Promise<void> {
  const all = await getEpisodes();
  const idx = all.findIndex(e => e.id === ep.id);
  if (idx >= 0) all[idx] = ep;
  else all.unshift(ep);
  all.sort((a, b) => b.timestamp - a.timestamp);
  await AsyncStorage.setItem(KEYS.episodes, JSON.stringify(all));
  if (_userId) pushEpisode(_userId, ep);
}

export async function deleteEpisode(id: string): Promise<void> {
  const all = await getEpisodes();
  await AsyncStorage.setItem(KEYS.episodes, JSON.stringify(all.filter(e => e.id !== id)));
  if (_userId) pushDelete(_userId, id);
}

/** Unique dates (YYYY-MM-DD) that have at least one logged episode */
export async function getLoggedDates(): Promise<string[]> {
  const all = await getEpisodes();
  return [...new Set(all.map(e => e.date))].sort();
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  language: 'uz',
  cycleLength: 28,
  periodLength: 5,
  lastPeriodStart: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
  notificationsEnabled: false,
  onboardingCompleted: false,
  reminderTime: '21:00',
  periodActive: false,
  theme: 'system',
  discreetNotifications: true,
};

export async function getSettings(): Promise<UserSettings> {
  const raw = await AsyncStorage.getItem(KEYS.settings);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
}

export async function patchSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(next));
  if (_userId) pushSettings(_userId, next);
  return next;
}

// ─── Challenges ──────────────────────────────────────────────────────────────

const INITIAL_CHALLENGES: Challenge[] = [
  { id: '3day',       startDate: new Date().toISOString().split('T')[0], loggedDates: [], completed: false },
  { id: '7day',       startDate: new Date().toISOString().split('T')[0], loggedDates: [], completed: false },
  { id: 'full_cycle', startDate: new Date().toISOString().split('T')[0], loggedDates: [], completed: false },
];

export async function getChallenges(): Promise<Challenge[]> {
  const raw = await AsyncStorage.getItem(KEYS.challenges);
  return raw ? JSON.parse(raw) : INITIAL_CHALLENGES;
}

export async function updateChallengesForDate(date: string): Promise<Challenge[]> {
  const challenges = await getChallenges();
  const settings   = await getSettings();
  const today      = new Date().toISOString().split('T')[0];

  for (const ch of challenges) {
    if (ch.completed) continue;
    if (!ch.loggedDates.includes(date)) ch.loggedDates.push(date);

    const streak = longestConsecutiveStreak(ch.loggedDates);

    if (ch.id === '3day'       && streak >= 3)                      { ch.completed = true; ch.completedDate = today; }
    if (ch.id === '7day'       && streak >= 7)                      { ch.completed = true; ch.completedDate = today; }
    if (ch.id === 'full_cycle' && ch.loggedDates.length >= settings.cycleLength) {
      ch.completed = true; ch.completedDate = today;
    }
  }

  await AsyncStorage.setItem(KEYS.challenges, JSON.stringify(challenges));
  if (_userId) pushChallenges(_userId, challenges);
  return challenges;
}

function longestConsecutiveStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort();
  let max = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00');
    const curr = new Date(sorted[i]     + 'T12:00:00');
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    cur = diff === 1 ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return max;
}

export { longestConsecutiveStreak };

// ─── Cycle helpers ────────────────────────────────────────────────────────────

export function cyclePhaseForDate(date: string, settings: UserSettings): {
  dayOfCycle: number;
  phase: 'period' | 'follicular' | 'ovulation' | 'luteal';
  nextPeriodDate: string;
} {
  const start     = new Date(settings.lastPeriodStart + 'T12:00:00');
  const target    = new Date(date + 'T12:00:00');
  const diffDays  = Math.round((target.getTime() - start.getTime()) / 86400000);
  const dayOfCycle = ((diffDays % settings.cycleLength) + settings.cycleLength) % settings.cycleLength + 1;

  const ovulationDay = settings.cycleLength - 14;
  let phase: 'period' | 'follicular' | 'ovulation' | 'luteal';
  if (dayOfCycle <= settings.periodLength) phase = 'period';
  else if (dayOfCycle < ovulationDay - 1)  phase = 'follicular';
  else if (dayOfCycle <= ovulationDay + 1) phase = 'ovulation';
  else                                     phase = 'luteal';

  const daysUntilNext   = settings.cycleLength - dayOfCycle + 1;
  const nextPeriod      = new Date(target);
  nextPeriod.setDate(nextPeriod.getDate() + daysUntilNext);
  const nextPeriodDate  = nextPeriod.toISOString().split('T')[0];

  return { dayOfCycle, phase, nextPeriodDate };
}

// ─── Demo seed ────────────────────────────────────────────────────────────────

export async function seedIfEmpty(): Promise<void> {
  const all = await getEpisodes();
  if (all.length > 0) return;

  const today = new Date();
  const seed: Omit<Episode, 'id'>[] = [
    { type: 'daily',   date: daysAgo(today, 6), timestamp: ts(today, 6, 9),  painLevel: 3, painLocations: ['lower_abdomen'], symptoms: ['fatigue'], reliefMethods: ['rest'], notes: '', flow: 'medium' },
    { type: 'episode', date: daysAgo(today, 5), timestamp: ts(today, 5, 8),  painLevel: 7, painLocations: ['lower_abdomen', 'lower_back'], symptoms: ['bloating', 'headache'], reliefMethods: ['medication'], notes: '', flow: 'heavy' },
    { type: 'episode', date: daysAgo(today, 5), timestamp: ts(today, 5, 14), painLevel: 6, painLocations: ['lower_abdomen'], symptoms: ['nausea'], reliefMethods: ['heat'], notes: '', flow: 'heavy' },
    { type: 'daily',   date: daysAgo(today, 4), timestamp: ts(today, 4, 9),  painLevel: 9, painLocations: ['lower_abdomen', 'thighs', 'lower_back'], symptoms: ['bloating', 'mood_swings', 'fatigue'], reliefMethods: ['heat', 'medication'], notes: '', flow: 'medium' },
    { type: 'daily',   date: daysAgo(today, 3), timestamp: ts(today, 3, 10), painLevel: 6, painLocations: ['lower_abdomen'], symptoms: ['fatigue', 'bloating'], reliefMethods: ['rest'], notes: '', flow: 'light' },
    { type: 'daily',   date: daysAgo(today, 2), timestamp: ts(today, 2, 11), painLevel: 4, painLocations: ['lower_back'], symptoms: ['fatigue'], reliefMethods: ['exercise'], notes: '', flow: 'spotting' },
    { type: 'daily',   date: daysAgo(today, 1), timestamp: ts(today, 1, 9),  painLevel: 2, painLocations: ['lower_abdomen'], symptoms: [], reliefMethods: ['none'], notes: '' },
  ];

  const episodes: Episode[] = seed.map((s, i) => ({ ...s, id: `seed_${i}` }));
  await AsyncStorage.setItem(KEYS.episodes, JSON.stringify(episodes));

  // Mark 3-day challenge in progress (3 logged days among last 3)
  const challenges = await getChallenges();
  for (const d of [daysAgo(today, 1), daysAgo(today, 2), daysAgo(today, 3)]) {
    for (const ch of challenges) {
      if (!ch.loggedDates.includes(d)) ch.loggedDates.push(d);
    }
  }
  await AsyncStorage.setItem(KEYS.challenges, JSON.stringify(challenges));
}

// ─── Family ───────────────────────────────────────────────────────────────────

const MEMBER_COLORS = ['#8B6BA0', '#D4915A', '#4DB880', '#EF5675', '#F5A623', '#5B9BD5'];

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const raw = await AsyncStorage.getItem(KEYS.familyMembers);
  return raw ? JSON.parse(raw) : [];
}

export async function saveFamilyMembers(members: FamilyMember[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.familyMembers, JSON.stringify(members));
}

export async function getActiveMemberId(): Promise<string> {
  const id = await AsyncStorage.getItem(KEYS.activeMemberId);
  return id ?? 'self';
}

export async function setActiveMemberId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.activeMemberId, id);
}

export function createMember(name: string, relation: string, index: number): FamilyMember {
  return {
    id: `member_${Date.now()}_${index}`,
    name,
    relation,
    color: MEMBER_COLORS[index % MEMBER_COLORS.length],
    isOwner: false,
  };
}

export async function getEpisodesForMember(memberId: string): Promise<Episode[]> {
  const all = await getEpisodes();
  return all.filter(e => (e.memberId ?? 'self') === memberId);
}

function daysAgo(from: Date, n: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function ts(from: Date, daysBack: number, hour: number): number {
  const d = new Date(from);
  d.setDate(d.getDate() - daysBack);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}
