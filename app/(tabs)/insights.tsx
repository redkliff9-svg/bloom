import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { SERIF, painColor } from '../../src/constants';
import { useColors } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { getActiveMemberId, getEpisodes, longestConsecutiveStreak } from '../../src/storage';
import { Episode } from '../../src/types';

export default function InsightsScreen() {
  const { t } = useI18n();
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [all, activeId] = await Promise.all([getEpisodes(), getActiveMemberId()]);
      setEpisodes(all.filter(e => (e.memberId ?? 'self') === activeId));
    })();
  }, []));

  if (episodes.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}><Text style={s.title}>{t('insights')}</Text></View>
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📊</Text>
          <Text style={s.emptyTitle}>{t('insights')}</Text>
          <Text style={s.emptyHint}>{t('no_entries')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dates   = [...new Set(episodes.map(e => e.date))].sort();
  const streak  = longestConsecutiveStreak(dates);
  const avg     = episodes.reduce((acc, e) => acc + e.painLevel, 0) / episodes.length;

  const painByHour: Record<string, number[]> = { morning: [], afternoon: [], evening: [] };
  for (const ep of episodes) {
    const h = new Date(ep.timestamp).getHours();
    const bucket = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
    painByHour[bucket].push(ep.painLevel);
  }

  const avgByHour = Object.entries(painByHour).map(([label, vals]) => ({
    label,
    avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
    count: vals.length,
  }));
  const maxHourAvg = Math.max(...avgByHour.map(h => h.avg), 1);

  const symCounts: Record<string, number> = {};
  for (const ep of episodes)
    for (const sym of ep.symptoms)
      symCounts[sym] = (symCounts[sym] ?? 0) + 1;
  const topSyms = Object.entries(symCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const reliefCounts: Record<string, number> = {};
  for (const ep of episodes)
    for (const r of ep.reliefMethods)
      reliefCounts[r] = (reliefCounts[r] ?? 0) + 1;

  const today = new Date();
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const ds = d.toISOString().split('T')[0];
    const dayEps = episodes.filter(e => e.date === ds);
    return { date: ds, day: d.getDate(), pain: dayEps.length ? Math.max(...dayEps.map(e => e.painLevel)) : 0 };
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}><Text style={s.title}>{t('insights')}</Text></View>

        <View style={s.statRow}>
          <StatCard label={t('days_tracked')}     value={dates.length.toString()} color={c.PINK} c={c} />
          <StatCard label={t('avg_pain')}          value={avg.toFixed(1)}          color={painColor(Math.round(avg))} c={c} />
          <StatCard label={t('tracking_streak')}   value={`${streak}d`}            color='#F5A623' c={c} />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{t('pain_14days')}</Text>
          <View style={s.trendChart}>
            {last14.map((day, i) => (
              <View key={i} style={s.trendCol}>
                <View style={s.trendBg}>
                  {day.pain > 0 && (
                    <View style={[s.trendBar, { height: `${day.pain * 10}%`, backgroundColor: painColor(day.pain) }]} />
                  )}
                </View>
                {i % 7 === 0 && <Text style={s.trendLbl}>{day.day}</Text>}
              </View>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{t('when_pain_peaks')}</Text>
          {avgByHour.map(({ label, avg: a, count }) => (
            <View key={label} style={s.hourRow}>
              <Text style={s.hourLabel}>{t(label as any)}</Text>
              <View style={s.barBg}>
                <View style={[s.barFill, {
                  width: count === 0 ? '0%' : `${(a / maxHourAvg) * 100}%`,
                  backgroundColor: a > 7 ? '#EF5675' : a > 4 ? '#F5A623' : '#4DB880',
                }]} />
              </View>
              <Text style={s.hourVal}>{count === 0 ? '–' : a.toFixed(1)}</Text>
            </View>
          ))}
        </View>

        {topSyms.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>{t('symptoms')}</Text>
            {topSyms.map(([name, count]) => (
              <View key={name} style={s.symRow}>
                <Text style={s.symName}>{t(name as any)}</Text>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${(count / episodes.length) * 100}%`, backgroundColor: c.PINK }]} />
                </View>
                <Text style={s.symPct}>{Math.round((count / episodes.length) * 100)}%</Text>
              </View>
            ))}
          </View>
        )}

        {Object.keys(reliefCounts).length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>{t('relief_methods')}</Text>
            <View style={s.reliefChips}>
              {Object.entries(reliefCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([r, count]) => (
                  <View key={r} style={s.reliefChip}>
                    <Text style={s.reliefEmoji}>{reliefEmoji(r)}</Text>
                    <Text style={s.reliefLabel}>{t(r as any)}</Text>
                    <Text style={s.reliefCount}>{count}×</Text>
                  </View>
                ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color, c }: {
  label: string; value: string; color: string; c: ReturnType<typeof useColors>;
}) {
  const sc = useMemo(() => StyleSheet.create({
    card: { flex: 1, backgroundColor: c.SURFACE, borderRadius: 20, padding: 14, alignItems: 'center', ...(c.card as object) },
    val:  { fontSize: 26, fontWeight: '800', marginBottom: 4 },
    lbl:  { fontSize: 10, color: c.MUTED, fontWeight: '600', textAlign: 'center' },
  }), [c]);
  return (
    <View style={sc.card}>
      <Text style={[sc.val, { color }]}>{value}</Text>
      <Text style={sc.lbl}>{label}</Text>
    </View>
  );
}

function reliefEmoji(r: string) {
  return { heat: '🔥', medication: '💊', rest: '😴', exercise: '🏃', none: '—' }[r] ?? '•';
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:        { flex: 1, backgroundColor: c.BG },
    content:     { paddingBottom: 40 },
    header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title:       { fontSize: 26, fontWeight: '700', color: c.DARK, fontFamily: SERIF },
    empty:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyIcon:   { fontSize: 48, marginBottom: 12 },
    emptyTitle:  { fontSize: 18, fontWeight: '700', color: c.DARK, marginBottom: 6 },
    emptyHint:   { fontSize: 14, color: c.MUTED },
    statRow:     { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 14 },
    card:        { backgroundColor: c.SURFACE, borderRadius: 20, padding: 18, marginHorizontal: 16, marginBottom: 14, ...(c.card as object) },
    cardTitle:   { fontSize: 15, fontWeight: '700', color: c.DARK, marginBottom: 14 },
    trendChart:  { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 3 },
    trendCol:    { flex: 1, alignItems: 'center' },
    trendBg:     { flex: 1, width: '100%', backgroundColor: c.BG, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
    trendBar:    { width: '100%', borderRadius: 4 },
    trendLbl:    { fontSize: 9, color: c.MUTED, marginTop: 3 },
    hourRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    hourLabel:   { width: 80, fontSize: 13, color: c.DARK, fontWeight: '500' },
    hourVal:     { width: 30, fontSize: 12, color: c.MUTED, textAlign: 'right' },
    barBg:       { flex: 1, height: 8, backgroundColor: c.BG, borderRadius: 4, overflow: 'hidden' },
    barFill:     { height: '100%', borderRadius: 4 },
    symRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    symName:     { width: 100, fontSize: 13, color: c.DARK, fontWeight: '500' },
    symPct:      { width: 35, fontSize: 12, color: c.MUTED, textAlign: 'right' },
    reliefChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    reliefChip:  { backgroundColor: c.isDark ? '#2E2848' : c.BG, borderRadius: 14, padding: 12, alignItems: 'center', minWidth: 80 },
    reliefEmoji: { fontSize: 22, marginBottom: 4 },
    reliefLabel: { fontSize: 11, color: c.DARK, fontWeight: '600', textAlign: 'center' },
    reliefCount: { fontSize: 11, color: c.MUTED, marginTop: 2 },
  });
}
