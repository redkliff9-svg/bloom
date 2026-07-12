import { useCallback, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { SERIF, painColor } from '../../src/constants';
import { useColors } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { cyclePhaseForDate, getActiveMemberId, getEpisodes, getFamilyMembers, getSettings, patchSettings, setActiveMemberId } from '../../src/storage';
import { Episode, FamilyMember, UserSettings } from '../../src/types';
import WeekStrip from '../../src/components/WeekStrip';
import NudgeCard from '../../src/components/NudgeCard';
import { useNudge } from '../../src/hooks/useNudge';

export default function TodayScreen() {
  const { t, lang } = useI18n();
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const today = new Date().toISOString().split('T')[0];
  const [episodes, setEpisodes]         = useState<Episode[]>([]);
  const [settings, setSettings]         = useState<UserSettings | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberIdState] = useState<string>('self');
  const [showSwitcher, setShowSwitcher] = useState(false);
  const { nudge, dismiss } = useNudge(lang);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [eps, s, members, activeId] = await Promise.all([
        getEpisodes(), getSettings(), getFamilyMembers(), getActiveMemberId(),
      ]);
      setEpisodes(eps);
      setSettings(s);
      setFamilyMembers(members);
      setActiveMemberIdState(activeId);
    })();
  }, []));

  async function switchMember(id: string) {
    await setActiveMemberId(id);
    setActiveMemberIdState(id);
    setShowSwitcher(false);
  }

  const memberEps  = episodes.filter(e => (e.memberId ?? 'self') === activeMemberId);
  const todayEps   = memberEps.filter(e => e.date === today);
  const maxPain    = todayEps.length ? Math.max(...todayEps.map(e => e.painLevel)) : 0;
  const hasSummary = todayEps.some(e => e.type === 'daily');

  const activeName = activeMemberId === 'self'
    ? t('just_me')
    : (familyMembers.find(m => m.id === activeMemberId)?.name ?? t('just_me'));

  const cycleInfo = settings ? cyclePhaseForDate(today, settings) : null;

  const _now = new Date();
  const dateLabel = `${_now.getDate()} ${t('months').split(',')[_now.getMonth()]}`;

  function openLog(type: 'episode' | 'daily') {
    router.push({ pathname: '/log', params: { type } });
  }

  async function togglePeriod() {
    if (!settings) return;
    const next = await patchSettings(
      settings.periodActive
        ? { periodActive: false }
        : { periodActive: true, lastPeriodStart: today }
    );
    setSettings(next);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.dateLabel}>{dateLabel}</Text>
            {settings?.periodActive && (
              <Text style={[s.cycleLabel, { color: c.PINK }]}>🩸 {t('period_active')}</Text>
            )}
            {!settings?.periodActive && cycleInfo && (
              <Text style={s.cycleLabel}>{t('cycle_day')} {cycleInfo.dayOfCycle} · {t('next_period')}: {cycleInfo.nextPeriodDate}</Text>
            )}
          </View>
          {familyMembers.length > 0 && (
            <TouchableOpacity style={s.switcherBtn} onPress={() => setShowSwitcher(true)}>
              <Text style={s.switcherTxt}>{activeName}</Text>
              <Text style={s.switcherArrow}>▾</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile switcher modal */}
        <Modal visible={showSwitcher} transparent animationType="fade" onRequestClose={() => setShowSwitcher(false)}>
          <TouchableWithoutFeedback onPress={() => setShowSwitcher(false)}>
            <View style={s.swOverlay}>
              <TouchableWithoutFeedback>
                <View style={s.swCard}>
                  <Text style={s.swLabel}>{t('switch_member')}</Text>
                  <TouchableOpacity
                    style={[s.swRow, activeMemberId === 'self' && s.swRowActive]}
                    onPress={() => switchMember('self')}
                  >
                    <Text style={s.swAvatar}>🙋</Text>
                    <Text style={[s.swName, activeMemberId === 'self' && { color: c.PINK }]}>{t('just_me')}</Text>
                    {activeMemberId === 'self' && <Text style={s.swCheck}>✓</Text>}
                  </TouchableOpacity>
                  {familyMembers.map(m => (
                    <TouchableOpacity
                      key={m.id}
                      style={[s.swRow, activeMemberId === m.id && s.swRowActive]}
                      onPress={() => switchMember(m.id)}
                    >
                      <View style={[s.swColorDot, { backgroundColor: m.color }]} />
                      <Text style={[s.swName, activeMemberId === m.id && { color: c.PINK }]}>{m.name}</Text>
                      {activeMemberId === m.id && <Text style={s.swCheck}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Week strip */}
        <WeekStrip episodes={episodes} today={today} />

        {/* AI nudge */}
        {nudge && <NudgeCard nudge={nudge} onDismiss={dismiss} />}

        {/* Status */}
        <View style={s.statusSection}>
          {maxPain > 0 ? (
            <>
              <Text style={s.statusLbl}>{t('todays_pain')}</Text>
              <Text style={[s.statusNum, { color: painColor(maxPain) }]}>{maxPain}</Text>
              <Text style={[s.statusSub, { color: painColor(maxPain) }]}>
                {t(painLabelKey(maxPain))}
              </Text>
              <Text style={s.episodeCount}>
                {todayEps.length} {t('entries_today')}
              </Text>
            </>
          ) : (
            <>
              <Text style={s.statusLbl}>{t('no_entry_today')}</Text>
              <Text style={s.statusHint}>{t('log_your_pain')}</Text>
            </>
          )}
        </View>

        {/* Action buttons */}
        <View style={s.actionsRow}>
          <ActionBtn
            icon={<Ionicons name="add-circle" size={28} color={c.WHITE} />}
            label={t('log_episode')}
            color={c.PINK}
            onPress={() => openLog('episode')}
          />
          <ActionBtn
            icon={<Ionicons name="checkmark-circle" size={28} color={hasSummary ? c.WHITE : c.PINK} />}
            label={t('daily_checkin')}
            color={hasSummary ? '#4DB880' : c.SURFACE}
            onPress={() => openLog('daily')}
          />
          <ActionBtn
            icon={<Ionicons name="list" size={28} color={c.DARK} />}
            label={t('tab_history')}
            color={c.SURFACE}
            onPress={() => router.push('/(tabs)/history')}
          />
        </View>

        {/* Period toggle */}
        <TouchableOpacity
          style={[s.periodBtn, settings?.periodActive && s.periodBtnActive]}
          onPress={togglePeriod}
        >
          <Text style={[s.periodBtnTxt, settings?.periodActive && s.periodBtnTxtActive]}>
            {settings?.periodActive ? `✓  ${t('mark_period_end')}` : `🩸  ${t('mark_period_start')}`}
          </Text>
        </TouchableOpacity>

        {/* Today's entries */}
        {todayEps.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>{t('todays_log')}</Text>
            {todayEps.map(ep => (
              <View key={ep.id} style={s.epRow}>
                <View style={[s.epDot, { backgroundColor: painColor(ep.painLevel) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.epTime}>
                    {new Date(ep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    {' · '}{ep.type === 'daily' ? t('daily_summary') : t('episode')}
                  </Text>
                  <Text style={s.epPain}>{t('pain_level')}: {ep.painLevel}/10</Text>
                </View>
                <View style={[s.epBadge, { backgroundColor: painColor(ep.painLevel) }]}>
                  <Text style={s.epBadgeTxt}>{ep.painLevel}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionBtn({ icon, label, color, onPress }: {
  icon: React.ReactNode; label: string; color: string; onPress: () => void;
}) {
  const c = useColors();
  return (
    <TouchableOpacity style={{ alignItems: 'center', gap: 8 }} onPress={onPress}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: color, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } }}>
        {icon}
      </View>
      <Text style={{ fontSize: 11, fontWeight: '600', color: c.DARK, textAlign: 'center', maxWidth: 72 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function painLabelKey(level: number): 'mild' | 'moderate' | 'severe' | 'very_severe' {
  if (level <= 3) return 'mild';
  if (level <= 6) return 'moderate';
  if (level <= 8) return 'severe';
  return 'very_severe';
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:         { flex: 1, backgroundColor: c.BG },
    content:      { paddingBottom: 40 },
    header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 22 },
    dateLabel:    { fontSize: 26, fontWeight: '700', color: c.DARK, fontFamily: SERIF },
    cycleLabel:   { fontSize: 13, color: c.MUTED, marginTop: 2 },
    statusSection:{ alignItems: 'center', paddingVertical: 28 },
    statusLbl:    { fontSize: 14, color: c.MUTED, fontWeight: '600', marginBottom: 8 },
    statusNum:    { fontSize: 80, fontWeight: '800', lineHeight: 90 },
    statusSub:    { fontSize: 20, fontWeight: '600', marginTop: 4 },
    statusHint:   { fontSize: 15, color: c.MUTED, marginTop: 4 },
    episodeCount: { fontSize: 12, color: c.MUTED, marginTop: 8 },
    actionsRow:   { flexDirection: 'row', justifyContent: 'center', gap: 28, paddingHorizontal: 20, marginBottom: 16 },
    periodBtn:    { marginHorizontal: 20, marginBottom: 20, paddingVertical: 13, borderRadius: 14, backgroundColor: c.isDark ? '#3D2030' : '#FDE8EE', alignItems: 'center', borderWidth: 1.5, borderColor: c.isDark ? '#6B304A' : '#F5C2CC' },
    periodBtnActive:   { backgroundColor: '#4DB880', borderColor: '#3aad6e' },
    periodBtnTxt:      { fontSize: 15, fontWeight: '700', color: c.PINK },
    periodBtnTxtActive:{ color: c.WHITE },
    card:      { backgroundColor: c.SURFACE, borderRadius: 20, padding: 18, marginHorizontal: 16, marginBottom: 14, ...(c.card as object) },
    cardTitle: { fontSize: 15, fontWeight: '700', color: c.DARK, marginBottom: 14 },
    epRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.BORDER },
    epDot:  { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
    epTime: { fontSize: 12, color: c.MUTED, marginBottom: 2 },
    epPain: { fontSize: 13, fontWeight: '600', color: c.DARK },
    epBadge:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    epBadgeTxt:   { fontSize: 13, fontWeight: '700', color: c.WHITE },
    switcherBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.SURFACE, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, ...(c.card as object) },
    switcherTxt:  { fontSize: 13, fontWeight: '700', color: c.PINK },
    switcherArrow:{ fontSize: 10, color: c.PINK },
    swOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 80, paddingRight: 16 },
    swCard:     { backgroundColor: c.SURFACE, borderRadius: 18, minWidth: 200, ...(c.card as object), overflow: 'hidden' },
    swLabel:    { fontSize: 11, fontWeight: '700', color: c.MUTED, textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
    swRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.BORDER },
    swRowActive:{ backgroundColor: c.isDark ? '#2E2848' : '#F9F5FF' },
    swAvatar:   { fontSize: 18 },
    swColorDot: { width: 18, height: 18, borderRadius: 9 },
    swName:     { flex: 1, fontSize: 14, fontWeight: '600', color: c.DARK },
    swCheck:    { fontSize: 14, color: c.PINK, fontWeight: '700' },
  });
}
