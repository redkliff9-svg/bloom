import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchEpisodesRemote, fetchSettingsRemote, fetchChallengesRemote,
  upsertEpisodeRemote, upsertSettingsRemote, upsertChallengesRemote,
  deleteEpisodeRemote,
} from './remote';
import { Challenge, Episode, UserSettings } from '../types';

const KEYS = {
  episodes:       'blooms_episodes',
  settings:       'blooms_settings',
  challenges:     'blooms_challenges',
  pendingDeletes: 'blooms_pending_deletes',
} as const;

// ─── Full pull: Supabase → local cache ────────────────────────────────────────
// Called on app launch (after login) and when app comes to foreground.
export async function syncFromRemote(userId: string): Promise<void> {
  try {
    const [episodes, settings, challenges] = await Promise.all([
      fetchEpisodesRemote(userId),
      fetchSettingsRemote(userId),
      fetchChallengesRemote(userId),
    ]);

    if (episodes.length > 0) {
      await AsyncStorage.setItem(KEYS.episodes, JSON.stringify(episodes));
    }

    if (settings) {
      const localRaw = await AsyncStorage.getItem(KEYS.settings);
      const local    = localRaw ? JSON.parse(localRaw) : {};
      await AsyncStorage.setItem(KEYS.settings, JSON.stringify({ ...local, ...settings }));
    }

    if (challenges.length > 0) {
      await AsyncStorage.setItem(KEYS.challenges, JSON.stringify(challenges));
    }

    // Flush any pending deletes that failed earlier
    await flushPendingDeletes();
  } catch {
    // Network failure — local cache remains valid, app stays usable
  }
}

// ─── Upload local data to Supabase (called once after first login) ────────────
export async function uploadLocalData(userId: string): Promise<void> {
  try {
    const [episodesRaw, settingsRaw, challengesRaw] = await Promise.all([
      AsyncStorage.getItem(KEYS.episodes),
      AsyncStorage.getItem(KEYS.settings),
      AsyncStorage.getItem(KEYS.challenges),
    ]);

    const episodes:   Episode[]     = episodesRaw   ? JSON.parse(episodesRaw)   : [];
    const settings:   UserSettings  = settingsRaw   ? JSON.parse(settingsRaw)   : null;
    const challenges: Challenge[]   = challengesRaw ? JSON.parse(challengesRaw) : [];

    await Promise.all([
      ...episodes.map(ep => upsertEpisodeRemote(userId, ep)),
      settings ? upsertSettingsRemote(userId, settings) : Promise.resolve(),
      upsertChallengesRemote(userId, challenges),
    ]);
  } catch {
    // Best-effort — will retry on next sync
  }
}

// ─── Push helpers (fire-and-forget after local writes) ────────────────────────

export async function pushEpisode(userId: string, ep: Episode): Promise<void> {
  try { await upsertEpisodeRemote(userId, ep); } catch { /* retry on next sync */ }
}

export async function pushDelete(userId: string, id: string): Promise<void> {
  try {
    await deleteEpisodeRemote(id);
  } catch {
    const raw     = await AsyncStorage.getItem(KEYS.pendingDeletes);
    const pending = raw ? JSON.parse(raw) as string[] : [];
    if (!pending.includes(id)) {
      await AsyncStorage.setItem(KEYS.pendingDeletes, JSON.stringify([...pending, id]));
    }
  }
}

export async function pushSettings(userId: string, settings: UserSettings): Promise<void> {
  try { await upsertSettingsRemote(userId, settings); } catch { /* retry on next sync */ }
}

export async function pushChallenges(userId: string, challenges: Challenge[]): Promise<void> {
  try { await upsertChallengesRemote(userId, challenges); } catch { /* retry on next sync */ }
}

// ─── Flush queued deletes ─────────────────────────────────────────────────────
async function flushPendingDeletes(): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.pendingDeletes);
  if (!raw) return;
  const pending = JSON.parse(raw) as string[];
  if (!pending.length) return;

  const results = await Promise.allSettled(pending.map(id => deleteEpisodeRemote(id)));
  const failed  = pending.filter((_, i) => results[i].status === 'rejected');
  await AsyncStorage.setItem(KEYS.pendingDeletes, JSON.stringify(failed));
}
