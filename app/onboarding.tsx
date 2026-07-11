import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { BG, DARK, MUTED, PINK, WHITE, CARD_SHADOW } from '../src/constants';
import { useI18n } from '../src/i18n';
import { patchSettings } from '../src/storage';
import { Lang } from '../src/types';

const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: 'uz', label: "O'zbek",  native: "O'zbek tili" },
  { code: 'ru', label: 'Русский', native: 'Русский язык' },
  { code: 'en', label: 'English', native: 'English' },
];

const STEPS = ['language', 'cycle', 'notifications', 'challenge'] as const;
type Step = typeof STEPS[number];

export default function Onboarding() {
  const { t, lang, setLang } = useI18n();
  const [step, setStep]         = useState<Step>('language');
  const [cycleLen, setCycleLen] = useState(28);
  const [periodLen, setPeriodLen] = useState(5);

  const stepIndex = STEPS.indexOf(step);

  async function finish() {
    await patchSettings({
      onboardingCompleted: true,
      cycleLength: cycleLen,
      periodLength: periodLen,
    });
    router.replace('/(tabs)');
  }

  async function requestNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    await patchSettings({ notificationsEnabled: status === 'granted' });
    setStep('challenge');
  }

  // ── Language step ──────────────────────────────────────────────────────────
  if (step === 'language') return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <Text style={s.emoji}>🌸</Text>
        <Text style={s.title}>Blooms</Text>
        <Text style={s.sub}>{t('welcome_sub')}</Text>

        <Text style={[s.sectionTitle, { marginTop: 40 }]}>{t('choose_language')}</Text>
        {LANGUAGES.map(l => (
          <TouchableOpacity
            key={l.code}
            style={[s.langBtn, lang === l.code && s.langBtnActive]}
            onPress={() => setLang(l.code)}
          >
            <Text style={[s.langLabel, lang === l.code && s.langLabelActive]}>{l.label}</Text>
            <Text style={[s.langNative, lang === l.code && { color: WHITE }]}>{l.native}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.footer}>
        <StepDots current={0} total={4} />
        <PrimaryBtn label={t('next')} onPress={() => setStep('cycle')} />
      </View>
    </SafeAreaView>
  );

  // ── Cycle step ─────────────────────────────────────────────────────────────
  if (step === 'cycle') return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <Text style={s.emoji}>📅</Text>
        <Text style={s.title}>{t('cycle_info')}</Text>
        <Text style={s.sub}>{t('cycle_info_sub')}</Text>

        <View style={s.card}>
          <Text style={s.cardLabel}>{t('cycle_length')}</Text>
          <NumberStepper value={cycleLen} min={21} max={45} onChange={setCycleLen} unit={t('days_label')} />
        </View>
        <View style={s.card}>
          <Text style={s.cardLabel}>{t('period_length')}</Text>
          <NumberStepper value={periodLen} min={2} max={10} onChange={setPeriodLen} unit={t('days_label')} />
        </View>
      </View>
      <View style={s.footer}>
        <StepDots current={1} total={4} />
        <PrimaryBtn label={t('next')} onPress={() => setStep('notifications')} />
      </View>
    </SafeAreaView>
  );

  // ── Notifications step ─────────────────────────────────────────────────────
  if (step === 'notifications') return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <Text style={s.emoji}>🔔</Text>
        <Text style={s.title}>{t('enable_notifs')}</Text>
        <Text style={s.sub}>{t('notifs_sub')}</Text>

        <View style={s.card}>
          {(['notif_bullet_daily', 'notif_bullet_check', 'notif_bullet_cycle'] as const).map(key => (
            <View key={key} style={s.bulletRow}>
              <Text style={s.bulletText}>{t(key)}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={s.footer}>
        <StepDots current={2} total={4} />
        <PrimaryBtn label={t('enable_notifs')} onPress={requestNotifications} />
        <TouchableOpacity onPress={() => setStep('challenge')} style={s.skipBtn}>
          <Text style={s.skipText}>{t('skip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ── Challenge intro step ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <Text style={s.emoji}>🏆</Text>
        <Text style={s.title}>{t('challenge_intro')}</Text>
        <Text style={s.sub}>{t('challenge_intro_sub')}</Text>

        <View style={s.challengeCard}>
          {['1️⃣', '2️⃣', '3️⃣'].map((num, i) => (
            <View key={i} style={s.challengeRow}>
              <Text style={s.challengeNum}>{num}</Text>
              <View style={s.challengeBar} />
            </View>
          ))}
          <Text style={s.challengeReward}>🌸 {t('challenge_3day_desc')}</Text>
        </View>
      </View>
      <View style={s.footer}>
        <StepDots current={3} total={4} />
        <PrimaryBtn label={t('start')} onPress={finish} />
      </View>
    </SafeAreaView>
  );
}

function PrimaryBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={btn.root} onPress={onPress}>
      <Text style={btn.text}>{label}</Text>
    </TouchableOpacity>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={dot.row}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[dot.d, i === current && dot.active]} />
      ))}
    </View>
  );
}

function NumberStepper({ value, min, max, onChange, unit }: {
  value: number; min: number; max: number;
  onChange: (v: number) => void; unit: string;
}) {
  return (
    <View style={ns.row}>
      <TouchableOpacity style={ns.btn} onPress={() => onChange(Math.max(min, value - 1))}>
        <Text style={ns.btnTxt}>−</Text>
      </TouchableOpacity>
      <Text style={ns.val}>{value} <Text style={ns.unit}>{unit}</Text></Text>
      <TouchableOpacity style={ns.btn} onPress={() => onChange(Math.min(max, value + 1))}>
        <Text style={ns.btnTxt}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  content: { flex: 1, padding: 28, justifyContent: 'center' },
  emoji:   { fontSize: 56, textAlign: 'center', marginBottom: 12 },
  title:   { fontSize: 26, fontWeight: '800', color: DARK, textAlign: 'center', marginBottom: 8 },
  sub:     { fontSize: 15, color: MUTED, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: MUTED, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  langBtn: { backgroundColor: WHITE, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...CARD_SHADOW },
  langBtnActive: { backgroundColor: PINK },
  langLabel: { fontSize: 16, fontWeight: '700', color: DARK },
  langLabelActive: { color: WHITE },
  langNative: { fontSize: 13, color: MUTED },
  card: { backgroundColor: WHITE, borderRadius: 16, padding: 18, marginBottom: 14, ...CARD_SHADOW },
  cardLabel: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 14 },
  bulletRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BG },
  bulletText: { fontSize: 15, color: DARK },
  challengeCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, ...CARD_SHADOW },
  challengeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  challengeNum: { fontSize: 22, marginRight: 12 },
  challengeBar: { flex: 1, height: 8, backgroundColor: BG, borderRadius: 4 },
  challengeReward: { fontSize: 14, color: MUTED, marginTop: 8, textAlign: 'center' },
  footer: { padding: 24, gap: 12 },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: MUTED, fontSize: 14 },
});

const btn = StyleSheet.create({
  root: { backgroundColor: PINK, borderRadius: 16, padding: 17, alignItems: 'center' },
  text: { color: WHITE, fontSize: 16, fontWeight: '700' },
});

const dot = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  d:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D8DAE8' },
  active: { backgroundColor: PINK, width: 24 },
});

const ns = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontSize: 22, color: DARK, fontWeight: '600' },
  val:    { fontSize: 22, fontWeight: '800', color: DARK },
  unit:   { fontSize: 14, fontWeight: '500', color: MUTED },
});
