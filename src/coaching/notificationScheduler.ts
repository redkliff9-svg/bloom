import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { cyclePhaseForDate } from '../storage';
import { Episode, Lang, UserSettings } from '../types';
import { getCoachingNudge } from './nudgeEngine';

export const NOTIF_SUPPORTED =
  Platform.OS !== 'web' && Constants.executionEnvironment !== 'storeClient';

export const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Cancel all scheduled notifications and re-schedule the next 14 days
 * with smart content. Call after any data change (new log, settings update).
 */
export async function scheduleSmartNotifications(
  settings: UserSettings,
  episodes: Episode[],
): Promise<void> {
  if (!NOTIF_SUPPORTED || !settings.notificationsEnabled) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const { h, m } = parseTime(settings.reminderTime ?? '21:00');
  const lang = settings.language;
  const discreet = (settings as any).discreetNotifications !== false;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Days already claimed by a smart trigger (to enforce 1/day cap)
  const smartDays = new Set<string>();

  // ── Smart trigger 1: 2 days before predicted period ──────────────────────
  const cycleInfo = cyclePhaseForDate(todayStr, settings);
  const nextPeriodDate = cycleInfo.nextPeriodDate;

  const prepDate = dateAddDays(nextPeriodDate, -2);
  if (prepDate > todayStr && isWithinDays(prepDate, today, 14)) {
    smartDays.add(prepDate);
    await scheduleSmart(
      'prep_period',
      discreet ? DISCREET_BODY[lang] : PRE_PERIOD_BODY[lang],
      prepDate, h, m,
    );
  }

  // ── Smart trigger 2: Predicted period start ──────────────────────────────
  if (nextPeriodDate > todayStr && isWithinDays(nextPeriodDate, today, 14)) {
    smartDays.add(nextPeriodDate);
    await scheduleSmart(
      'period_start',
      discreet ? DISCREET_BODY[lang] : PERIOD_START_BODY[lang],
      nextPeriodDate, h, m,
    );
  }

  // ── Smart trigger 3: Re-engagement after 3 days without logging ──────────
  const loggedDates = [...new Set(episodes.map(e => e.date))].sort();
  const lastLog = loggedDates[loggedDates.length - 1];
  if (lastLog) {
    const reengage = dateAddDays(lastLog, 3);
    if (reengage > todayStr && isWithinDays(reengage, today, 14) && !smartDays.has(reengage)) {
      smartDays.add(reengage);
      await scheduleSmart(
        'reengage',
        discreet ? DISCREET_BODY[lang] : REENGAGE_BODY[lang],
        reengage, h, m,
      );
    }
  }

  // ── Daily notifications for the remaining 14 days ────────────────────────
  for (let i = 1; i <= 14; i++) {
    const dayStr = dateAddDays(todayStr, i);
    if (smartDays.has(dayStr)) continue;

    let body: string;
    if (discreet) {
      body = DISCREET_BODY[lang];
    } else {
      // Use the coaching engine to generate relevant copy for that day
      const futureSettings = { ...settings };
      // Nudge engine uses "today" internally — pass episodes & settings as-is
      // For future days we just use the generic daily body to avoid complexity
      body = DAILY_BODY[lang];
    }

    await scheduleSmart(`daily_${i}`, body, dayStr, h, m);
  }
}

// ── Permission request ────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (!NOTIF_SUPPORTED) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function scheduleSmart(
  id: string,
  body: string,
  dateStr: string,
  hour: number,
  minute: number,
): Promise<void> {
  try {
    const trigger = new Date(dateStr + 'T12:00:00');
    trigger.setHours(hour, minute, 0, 0);
    const secondsUntil = Math.round((trigger.getTime() - Date.now()) / 1000);
    if (secondsUntil <= 60) return;

    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: 'blooms 🌸',
        body,
        sound: true,
      },
      trigger: { type: 'timeInterval', seconds: secondsUntil, repeats: false } as any,
    });
  } catch {
    // ignore individual scheduling failures
  }
}

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = (t ?? '21:00').split(':').map(Number);
  return { h: isNaN(h) ? 21 : h, m: isNaN(m) ? 0 : m };
}

function dateAddDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function isWithinDays(dateStr: string, from: Date, days: number): boolean {
  const d = new Date(dateStr + 'T12:00:00');
  return d.getTime() - from.getTime() <= days * 86400000;
}

// ── Notification copy ─────────────────────────────────────────────────────────

const DISCREET_BODY: Record<Lang, string> = {
  uz: "blooms: bugungi maslahat tayyor 🌸",
  ru: "blooms: сегодняшний совет готов 🌸",
  en: "blooms: your daily tip is ready 🌸",
};

const PRE_PERIOD_BODY: Record<Lang, string> = {
  uz: "Davringiz 2 kunda boshlanishi mumkin — issiq yostiqcha va choyingizni tayyorlab qo'ying 🌸",
  ru: "Цикл может начаться через 2 дня — приготовьте грелку и любимый чай 🌸",
  en: "Your period may arrive in 2 days — prep your heat pack and favourite tea 🌸",
};

const PERIOD_START_BODY: Record<Lang, string> = {
  uz: "Davringiz bugun boshlanishi kutilmoqda. O'zingizni asrang — bugungi holatni yozib qo'ying 🌸",
  ru: "Сегодня ожидается начало цикла. Берегите себя — запишите своё состояние 🌸",
  en: "Your period is expected today. Take care of yourself — log how you feel 🌸",
};

const REENGAGE_BODY: Record<Lang, string> = {
  uz: "Bir necha kun bo'ldi — xavotir yo'q! Bugun bir daqiqa ajrating va holatni yozib qo'ying 🌸",
  ru: "Прошло несколько дней — всё хорошо! Уделите минуту и запишите своё состояние 🌸",
  en: "It's been a few days — no worries! Take a minute to log how you've been feeling 🌸",
};

const DAILY_BODY: Record<Lang, string> = {
  uz: "Salom! Bugungi holatni yozib qo'ysangiz, bashoratlar aniqroq bo'ladi 🌸",
  ru: "Привет! Записи сегодня сделают прогнозы точнее 🌸",
  en: "Hey! Logging today keeps your predictions on track 🌸",
};
