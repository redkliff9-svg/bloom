import { supabase } from '../lib/supabase';
import { Challenge, Episode, UserSettings } from '../types';

// ─── Episodes ─────────────────────────────────────────────────────────────────

export async function fetchEpisodesRemote(userId: string): Promise<Episode[]> {
  const { data } = await supabase
    .from('episodes')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (!data) return [];
  return data.map(r => ({
    id:            r.id,
    type:          r.type as 'episode' | 'daily',
    date:          r.date,
    timestamp:     r.timestamp,
    painLevel:     r.pain_level,
    painLocations: r.pain_locations,
    symptoms:      r.symptoms,
    reliefMethods: r.relief_methods,
    notes:         r.notes,
    flow:          r.flow ?? undefined,
  }));
}

export async function upsertEpisodeRemote(userId: string, ep: Episode): Promise<void> {
  await supabase.from('episodes').upsert({
    id:             ep.id,
    user_id:        userId,
    type:           ep.type,
    date:           ep.date,
    timestamp:      ep.timestamp,
    pain_level:     ep.painLevel,
    pain_locations: ep.painLocations,
    symptoms:       ep.symptoms,
    relief_methods: ep.reliefMethods,
    notes:          ep.notes ?? '',
    flow:           ep.flow ?? null,
  }, { onConflict: 'id' });
}

export async function deleteEpisodeRemote(id: string): Promise<void> {
  await supabase.from('episodes').delete().eq('id', id);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function fetchSettingsRemote(userId: string): Promise<Partial<UserSettings> | null> {
  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) return null;
  return {
    language:             data.language,
    cycleLength:          data.cycle_length,
    periodLength:         data.period_length,
    lastPeriodStart:      data.last_period_start,
    notificationsEnabled: data.notifications_enabled,
    reminderTime:         data.reminder_time,
    periodActive:         data.period_active,
    onboardingCompleted:  data.onboarding_completed,
  };
}

export async function upsertSettingsRemote(userId: string, s: UserSettings): Promise<void> {
  await supabase.from('user_settings').upsert({
    user_id:                userId,
    language:               s.language,
    cycle_length:           s.cycleLength,
    period_length:          s.periodLength,
    last_period_start:      s.lastPeriodStart,
    notifications_enabled:  s.notificationsEnabled,
    reminder_time:          s.reminderTime,
    period_active:          s.periodActive,
    onboarding_completed:   s.onboardingCompleted,
  }, { onConflict: 'user_id' });
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export async function fetchChallengesRemote(userId: string): Promise<Challenge[]> {
  const { data } = await supabase
    .from('challenges')
    .select('*')
    .eq('user_id', userId);

  if (!data) return [];
  return data.map(r => ({
    id:            r.challenge_id,
    startDate:     r.start_date,
    loggedDates:   r.logged_dates,
    completed:     r.completed,
    completedDate: r.completed_date ?? undefined,
  }));
}

export async function upsertChallengesRemote(userId: string, challenges: Challenge[]): Promise<void> {
  if (!challenges.length) return;
  await supabase.from('challenges').upsert(
    challenges.map(ch => ({
      challenge_id:   ch.id,
      user_id:        userId,
      start_date:     ch.startDate,
      logged_dates:   ch.loggedDates,
      completed:      ch.completed,
      completed_date: ch.completedDate ?? null,
    })),
    { onConflict: 'challenge_id,user_id' }
  );
}
