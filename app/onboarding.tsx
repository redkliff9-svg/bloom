import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { SERIF } from '../src/constants';
import { useColors } from '../src/theme';
import { useI18n } from '../src/i18n';
import { patchSettings } from '../src/storage';
import { Lang } from '../src/types';

const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: 'uz', label: "O'zbek",  native: "O'zbek tili" },
  { code: 'ru', label: 'Русский', native: 'Русский язык' },
  { code: 'en', label: 'English', native: 'English' },
];

const STEPS = ['language', 'cycle', 'period', 'notifications', 'challenge'] as const;
type Step = typeof STEPS[number];

// Days-ago options shown in the period-start grid
const DAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 28];

function daysAgoToDate(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export default function Onboarding() {
  const { t, lang, setLang } = useI18n();
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);

  const [step, setStep]               = useState<Step>('language');
  const [cycleLen, setCycleLen]       = useState(28);
  const [periodLen, setPeriodLen]     = useState(5);
  const [daysAgo, setDaysAgo]         = useState<number | null>(null);

  const stepIndex = STEPS.indexOf(step);

  async function finish() {
    const lastPeriodStart = daysAgo !== null ? daysAgoToDate(daysAgo) : daysAgoToDate(14);
    await patchSettings({
      onboardingCompleted: true,
      cycleLength: cycleLen,
      periodLength: periodLen,
      lastPeriodStart,
    });
    router.replace('/(tabs)');
  }

  async function requestNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    await patchSettings({ notificationsEnabled: status === 'granted' });
    setStep('challenge');
  }

  // ── Language ────────────────────────────────────────────────────────────────
  if (step === 'language') return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <Text style={s.emoji}>🌸</Text>
        <Text style={s.title}>Blooms</Text>
        <Text style={s.sub}>{t('welcome_sub')}</Text>

        <Text style={s.sectionTitle}>{t('choose_language')}</Text>
        {LANGUAGES.map(l => (
          <TouchableOpacity
            key={l.code}
            style={[s.langBtn, lang === l.code && s.langBtnActive]}
            onPress={() => setLang(l.code)}
          >
            <Text style={[s.langLabel, lang === l.code && { color: c.WHITE }]}>{l.label}</Text>
            <Text style={[s.langNative, lang === l.code && { color: c.WHITE }]}>{l.native}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.footer}>
        <StepDots current={0} total={5} c={c} />
        <PrimaryBtn label={t('next')} onPress={() => setStep('cycle')} c={c} />
      </View>
    </SafeAreaView>
  );

  // ── Cycle info ──────────────────────────────────────────────────────────────
  if (step === 'cycle') return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <Text style={s.emoji}>📅</Text>
        <Text style={s.title}>{t('cycle_info')}</Text>
        <Text style={s.sub}>{t('cycle_info_sub')}</Text>

        <View style={s.card}>
          <Text style={s.cardLabel}>{t('cycle_length')}</Text>
          <NumberStepper value={cycleLen} min={21} max={45} onChange={setCycleLen} unit={t('days_label')} c={c} />
        </View>
        <View style={s.card}>
          <Text style={s.cardLabel}>{t('period_length')}</Text>
          <NumberStepper value={periodLen} min={2} max={10} onChange={setPeriodLen} unit={t('days_label')} c={c} />
        </View>
      </View>
      <View style={s.footer}>
        <StepDots current={1} total={5} c={c} />
        <PrimaryBtn label={t('next')} onPress={() => setStep('period')} c={c} />
      </View>
    </SafeAreaView>
  );

  // ── Period start ────────────────────────────────────────────────────────────
  if (step === 'period') return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <Text style={s.emoji}>🩸</Text>
        <Text style={s.title}>{t('period_start_q')}</Text>
        <Text style={s.sub}>{t('period_start_sub')}</Text>

        <View style={s.dayGrid}>
          {/* Today */}
          <TouchableOpacity
            style={[s.dayBtn, s.dayBtnWide, daysAgo === 0 && s.dayBtnActive]}
            onPress={() => setDaysAgo(0)}
          >
            <Text style={[s.dayBtnTxt, daysAgo === 0 && s.dayBtnTxtActive]}>{t('today')}</Text>
          </TouchableOpacity>

          {/* 1–7 days ago */}
          {[1, 2, 3, 4, 5, 6, 7].map(n => (
            <TouchableOpacity
              key={n}
              style={[s.dayBtn, daysAgo === n && s.dayBtnActive]}
              onPress={() => setDaysAgo(n)}
            >
              <Text style={[s.dayBtnNum, daysAgo === n && s.dayBtnTxtActive]}>{n}</Text>
              <Text style={[s.dayBtnSub, daysAgo === n && s.dayBtnSubActive]}>{t('days_ago')}</Text>
            </TouchableOpacity>
          ))}

          {/* 10, 14, 21, 28 days ago */}
          {[10, 14, 21, 28].map(n => (
            <TouchableOpacity
              key={n}
              style={[s.dayBtn, daysAgo === n && s.dayBtnActive]}
              onPress={() => setDaysAgo(n)}
            >
              <Text style={[s.dayBtnNum, daysAgo === n && s.dayBtnTxtActive]}>{n}</Text>
              <Text style={[s.dayBtnSub, daysAgo === n && s.dayBtnSubActive]}>{t('days_ago')}</Text>
            </TouchableOpacity>
          ))}

          {/* Not sure */}
          <TouchableOpacity
            style={[s.dayBtn, s.dayBtnWide, daysAgo === -1 && s.dayBtnActive]}
            onPress={() => setDaysAgo(-1)}
          >
            <Text style={[s.dayBtnTxt, daysAgo === -1 && s.dayBtnTxtActive]}>{t('not_sure')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.footer}>
        <StepDots current={2} total={5} c={c} />
        <PrimaryBtn
          label={t('next')}
          onPress={() => setStep('notifications')}
          c={c}
          disabled={daysAgo === null}
        />
        <TouchableOpacity onPress={() => { setDaysAgo(-1); setStep('notifications'); }} style={s.skipBtn}>
          <Text style={s.skipTxt}>{t('skip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ── Notifications ───────────────────────────────────────────────────────────
  if (step === 'notifications') return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <Text style={s.emoji}>🔔</Text>
        <Text style={s.title}>{t('enable_notifs')}</Text>
        <Text style={s.sub}>{t('notifs_sub')}</Text>

        <View style={s.card}>
          {(['notif_bullet_daily', 'notif_bullet_check', 'notif_bullet_cycle'] as const).map(key => (
            <View key={key} style={s.bulletRow}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>{t(key)}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={s.footer}>
        <StepDots current={3} total={5} c={c} />
        <PrimaryBtn label={t('enable_notifs')} onPress={requestNotifications} c={c} />
        <TouchableOpacity onPress={() => setStep('challenge')} style={s.skipBtn}>
          <Text style={s.skipTxt}>{t('skip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ── Challenge intro ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <Text style={s.emoji}>🏆</Text>
        <Text style={s.title}>{t('challenge_intro')}</Text>
        <Text style={s.sub}>{t('challenge_intro_sub')}</Text>

        <View style={s.card}>
          {[1, 2, 3].map(n => (
            <View key={n} style={s.challengeRow}>
              <View style={s.challengeBubble}>
                <Text style={s.challengeN}>{n}</Text>
              </View>
              <View style={[s.challengeBar, { width: `${33 * n}%` as any }]} />
            </View>
          ))}
          <Text style={s.challengeReward}>🌸 {t('challenge_3day_desc')}</Text>
        </View>
      </View>
      <View style={s.footer}>
        <StepDots current={4} total={5} c={c} />
        <PrimaryBtn label={t('start')} onPress={finish} c={c} />
      </View>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PrimaryBtn({ label, onPress, c, disabled }: {
  label: string; onPress: () => void;
  c: ReturnType<typeof useColors>; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={{ backgroundColor: c.PINK, borderRadius: 16, padding: 17, alignItems: 'center', opacity: disabled ? 0.4 : 1 }}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={{ color: c.WHITE, fontSize: 16, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function StepDots({ current, total, c }: {
  current: number; total: number; c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 22 : 7, height: 7, borderRadius: 4,
            backgroundColor: i === current ? c.PINK : c.BORDER,
          }}
        />
      ))}
    </View>
  );
}

function NumberStepper({ value, min, max, onChange, unit, c }: {
  value: number; min: number; max: number;
  onChange: (v: number) => void; unit: string;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <TouchableOpacity
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.BG, alignItems: 'center', justifyContent: 'center' }}
        onPress={() => onChange(Math.max(min, value - 1))}
      >
        <Text style={{ fontSize: 22, color: c.DARK, fontWeight: '600' }}>−</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 22, fontWeight: '800', color: c.DARK }}>
        {value} <Text style={{ fontSize: 14, fontWeight: '500', color: c.MUTED }}>{unit}</Text>
      </Text>
      <TouchableOpacity
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.BG, alignItems: 'center', justifyContent: 'center' }}
        onPress={() => onChange(Math.min(max, value + 1))}
      >
        <Text style={{ fontSize: 22, color: c.DARK, fontWeight: '600' }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:    { flex: 1, backgroundColor: c.BG },
    content: { flex: 1, padding: 28, justifyContent: 'center' },
    emoji:   { fontSize: 52, textAlign: 'center', marginBottom: 12 },
    title:   { fontSize: 26, fontWeight: '800', color: c.DARK, textAlign: 'center', marginBottom: 8, fontFamily: SERIF },
    sub:     { fontSize: 15, color: c.MUTED, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: c.MUTED, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
    card:    { backgroundColor: c.SURFACE, borderRadius: 18, padding: 18, marginBottom: 14, ...(c.card as object) },
    cardLabel: { fontSize: 14, fontWeight: '700', color: c.DARK, marginBottom: 14 },
    bulletRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.BORDER },
    bulletDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: c.PINK, flexShrink: 0 },
    bulletText: { fontSize: 15, color: c.DARK, flex: 1 },

    langBtn: { backgroundColor: c.SURFACE, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...(c.card as object) },
    langBtnActive: { backgroundColor: c.PINK },
    langLabel: { fontSize: 16, fontWeight: '700', color: c.DARK },
    langNative: { fontSize: 13, color: c.MUTED },

    // Day grid for period start
    dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    dayBtn: {
      width: '30%',
      aspectRatio: 1,
      borderRadius: 16,
      backgroundColor: c.SURFACE,
      alignItems: 'center',
      justifyContent: 'center',
      ...(c.card as object),
    },
    dayBtnWide: { width: '100%', aspectRatio: undefined, paddingVertical: 16 },
    dayBtnActive: { backgroundColor: c.PINK },
    dayBtnTxt:  { fontSize: 15, fontWeight: '700', color: c.DARK },
    dayBtnTxtActive: { color: c.WHITE },
    dayBtnNum:  { fontSize: 22, fontWeight: '800', color: c.DARK },
    dayBtnSub:  { fontSize: 10, color: c.MUTED, marginTop: 2 },
    dayBtnSubActive: { color: c.WHITE },

    challengeRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    challengeBubble: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.PINK, alignItems: 'center', justifyContent: 'center' },
    challengeN:      { fontSize: 14, fontWeight: '800', color: c.WHITE },
    challengeBar:    { height: 8, backgroundColor: c.isDark ? '#2E2848' : '#F0ECFF', borderRadius: 4 },
    challengeReward: { fontSize: 13, color: c.MUTED, marginTop: 6, textAlign: 'center' },

    footer:  { padding: 24, gap: 10 },
    skipBtn: { alignItems: 'center', paddingVertical: 6 },
    skipTxt: { color: c.MUTED, fontSize: 14 },
  });
}
