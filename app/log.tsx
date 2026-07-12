import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SERIF, painColor, painLabelKey } from '../src/constants';
import { useColors } from '../src/theme';
import { useI18n } from '../src/i18n';
import { getActiveMemberId, saveEpisode, updateChallengesForDate } from '../src/storage';
import { Episode, FlowIntensity, PainLocation, ReliefMethod, Symptom } from '../src/types';
import BloomModal from '../src/components/BloomModal';

const LOCATIONS: PainLocation[]     = ['lower_abdomen', 'lower_back', 'thighs', 'pelvis', 'upper_abdomen'];
const SYMPTOMS: Symptom[]           = ['bloating', 'headache', 'mood_swings', 'nausea', 'fatigue', 'breast_tenderness'];
const RELIEF: ReliefMethod[]        = ['heat', 'medication', 'rest', 'exercise', 'none'];
const FLOW_OPTIONS: FlowIntensity[] = ['spotting', 'light', 'medium', 'heavy'];

export default function LogScreen() {
  const { session, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const params    = useLocalSearchParams<{ type?: string; editId?: string; prefill?: string }>();

  useEffect(() => {
    if (!authLoading && !session) router.replace('/auth');
  }, [session, authLoading]);
  const editId    = params.editId ?? null;
  const prefilled = params.prefill ? (JSON.parse(params.prefill) as Episode) : null;
  const entryType = prefilled?.type ?? ((params.type === 'daily' ? 'daily' : 'episode') as 'episode' | 'daily');

  const [painLevel, setPainLevel] = useState(prefilled?.painLevel ?? 5);
  const [locations, setLocations] = useState<PainLocation[]>(prefilled?.painLocations ?? []);
  const [symptoms, setSymptoms]   = useState<Symptom[]>(prefilled?.symptoms ?? []);
  const [relief, setRelief]       = useState<ReliefMethod[]>(prefilled?.reliefMethods ?? []);
  const [flow, setFlow]           = useState<FlowIntensity | null>(prefilled?.flow ?? null);
  const [notes, setNotes]         = useState(prefilled?.notes ?? '');
  const [showBloom, setShowBloom] = useState(false);
  const [saving, setSaving]       = useState(false);

  function toggle<T>(arr: T[], setArr: (v: T[]) => void, item: T) {
    setArr(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);

    const now      = new Date();
    const date     = prefilled?.date ?? now.toISOString().split('T')[0];
    const memberId = prefilled?.memberId ?? await getActiveMemberId();
    const entry: Episode = {
      id:            editId ?? `${date}_${now.getTime()}`,
      type:          entryType,
      date,
      timestamp:     prefilled?.timestamp ?? now.getTime(),
      painLevel,
      painLocations: locations,
      symptoms,
      reliefMethods: relief.length ? relief : ['none'],
      notes,
      memberId,
      ...(flow ? { flow } : {}),
    };

    await saveEpisode(entry);
    await updateChallengesForDate(date);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowBloom(true);
  }

  function onBloomHide() {
    setShowBloom(false);
    setSaving(false);
    router.back();
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <BloomModal visible={showBloom} painLevel={painLevel} onHide={onBloomHide} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Ionicons name="close" size={18} color={c.MUTED} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {entryType === 'daily' ? t('daily_checkin') : t('log_episode')}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.card}>
          <Text style={s.cardTitle}>{t('pain_level')}</Text>
          <View style={s.painRow}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <TouchableOpacity
                key={n}
                style={[s.painBtn, painLevel === n && { backgroundColor: painColor(n), borderColor: painColor(n) }]}
                onPress={() => setPainLevel(n)}
              >
                <Text style={[s.painNum, painLevel === n && { color: c.WHITE }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[s.painLabel, { color: painColor(painLevel) }]}>
            {t(painLabelKey(painLevel))}
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{t('flow')}</Text>
          <View style={s.chips}>
            {FLOW_OPTIONS.map(f => (
              <Chip key={f} label={t((`flow_${f}`) as any)} active={flow === f}
                onPress={() => setFlow(flow === f ? null : f)} color="#EF5675" c={c} />
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{t('pain_location')}</Text>
          <View style={s.chips}>
            {LOCATIONS.map(loc => (
              <Chip key={loc} label={t(loc as any)} active={locations.includes(loc)}
                onPress={() => toggle(locations, setLocations, loc)} c={c} />
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{t('symptoms')}</Text>
          <View style={s.chips}>
            {SYMPTOMS.map(sym => (
              <Chip key={sym} label={t(sym as any)} active={symptoms.includes(sym)}
                onPress={() => toggle(symptoms, setSymptoms, sym)} c={c} />
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{t('relief_methods')}</Text>
          <View style={s.chips}>
            {RELIEF.map(r => (
              <Chip key={r} label={t(r as any)} active={relief.includes(r)}
                onPress={() => toggle(relief, setRelief, r)} color="#4DB880" c={c} />
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{t('notes')}</Text>
          <TextInput
            style={s.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('notes_placeholder')}
            placeholderTextColor={c.MUTED}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <Text style={s.saveTxt}>{editId ? t('update') : t('save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress, color, c }: {
  label: string; active: boolean; onPress: () => void; color?: string;
  c: ReturnType<typeof useColors>;
}) {
  const chipColor = color ?? c.PINK;
  return (
    <TouchableOpacity
      style={[
        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
          borderColor: active ? chipColor : c.BORDER,
          backgroundColor: active ? chipColor : c.isDark ? '#2A2848' : '#F3F4FB' },
        active && { borderColor: chipColor },
      ]}
      onPress={onPress}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: active ? c.WHITE : c.MUTED }}>{label}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:        { flex: 1, backgroundColor: c.BG },
    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: c.DARK, fontFamily: SERIF },
    closeBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: c.SURFACE, alignItems: 'center', justifyContent: 'center', ...(c.card as object) },
    scroll:      { flex: 1 },
    content:     { padding: 16, paddingBottom: 40 },
    card:        { backgroundColor: c.SURFACE, borderRadius: 20, padding: 18, marginBottom: 14, ...(c.card as object) },
    cardTitle:   { fontSize: 15, fontWeight: '700', color: c.DARK, marginBottom: 14 },
    painRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginBottom: 12 },
    painBtn:     { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: c.BORDER, alignItems: 'center', justifyContent: 'center', backgroundColor: c.isDark ? '#2A2848' : '#F3F4FB' },
    painNum:     { fontSize: 14, fontWeight: '700', color: c.MUTED },
    painLabel:   { textAlign: 'center', fontSize: 15, fontWeight: '700' },
    chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    notesInput:  { borderWidth: 1, borderColor: c.BORDER, borderRadius: 12, padding: 12, fontSize: 14, color: c.DARK, minHeight: 80, textAlignVertical: 'top', backgroundColor: c.isDark ? '#1E1C2A' : '#F3F4FB' },
    saveBtn:     { backgroundColor: c.PINK, borderRadius: 16, padding: 17, alignItems: 'center' },
    saveTxt:     { color: c.WHITE, fontSize: 16, fontWeight: '700' },
  });
}
