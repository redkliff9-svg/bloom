import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { SERIF } from '../../src/constants';
import { useColors } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { getChallenges, getEpisodes, longestConsecutiveStreak } from '../../src/storage';
import { Challenge, Episode } from '../../src/types';

const CHALLENGE_META: Record<string, { emoji: string; goal: number; titleKey: string; descKey: string }> = {
  '3day':       { emoji: '🌱', goal: 3,  titleKey: 'challenge_3day',  descKey: 'challenge_3day_desc' },
  '7day':       { emoji: '🌿', goal: 7,  titleKey: 'challenge_7day',  descKey: 'challenge_7day_desc' },
  'full_cycle': { emoji: '🌸', goal: 28, titleKey: 'challenge_cycle', descKey: 'challenge_cycle_desc' },
};

export default function ChallengesScreen() {
  const { t } = useI18n();
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [episodes, setEpisodes]     = useState<Episode[]>([]);

  useFocusEffect(useCallback(() => {
    getChallenges().then(setChallenges);
    getEpisodes().then(setEpisodes);
  }, []));

  const dates  = [...new Set(episodes.map(e => e.date))].sort();
  const streak = longestConsecutiveStreak(dates);

  const threeDayDone = challenges.find(ch => ch.id === '3day')?.completed;
  const insight      = threeDayDone ? generateInsight(episodes, t) : null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{t('challenges')}</Text>
        </View>

        <View style={s.streakCard}>
          <Text style={s.streakEmoji}>🔥</Text>
          <View>
            <Text style={s.streakNum}>{streak}</Text>
            <Text style={s.streakLbl}>{t('streak')} · {t('days_label')}</Text>
          </View>
          <View style={s.streakDots}>
            {Array.from({ length: Math.min(streak, 7) }, (_, i) => (
              <View key={i} style={[s.streakDot, i < streak && s.streakDotFilled]} />
            ))}
          </View>
        </View>

        {challenges.map(ch => {
          const meta     = CHALLENGE_META[ch.id];
          const progress = Math.min(ch.loggedDates.length, meta.goal);
          const pct      = progress / meta.goal;

          return (
            <View key={ch.id} style={[s.card, ch.completed && s.cardDone]}>
              <View style={s.cardHeader}>
                <Text style={s.cardEmoji}>{meta.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{t(meta.titleKey as any)}</Text>
                  <Text style={s.cardDesc}>{t(meta.descKey as any)}</Text>
                </View>
                {ch.completed && <Text style={s.badge}>✅</Text>}
              </View>

              <View style={s.progBg}>
                <View style={[s.progFill, { width: `${pct * 100}%`, backgroundColor: ch.completed ? '#4DB880' : c.PINK }]} />
              </View>
              <Text style={s.progLabel}>
                {progress}/{meta.goal} {t('days_label')} · {ch.completed ? t('completed') : t('in_progress')}
              </Text>

              <View style={s.dayDots}>
                {Array.from({ length: meta.goal }, (_, i) => (
                  <View key={i} style={[s.dayDot, i < progress && { backgroundColor: ch.completed ? '#4DB880' : c.PINK }]} />
                ))}
              </View>
            </View>
          );
        })}

        {insight && (
          <View style={s.insightCard}>
            <Text style={s.insightEmoji}>💡</Text>
            <Text style={s.insightTitle}>{t('first_insight')}</Text>
            <Text style={s.insightText}>{insight}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function generateInsight(episodes: Episode[], t: (k: any) => string): string {
  if (episodes.length < 3) return '';

  const byHour: Record<string, number[]> = { morning: [], afternoon: [], evening: [] };
  for (const ep of episodes) {
    const h = new Date(ep.timestamp).getHours();
    const b = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
    byHour[b].push(ep.painLevel);
  }

  const avgs = Object.entries(byHour)
    .filter(([, v]) => v.length > 0)
    .map(([k, v]) => ({ k, avg: v.reduce((a, b) => a + b, 0) / v.length }))
    .sort((a, b) => b.avg - a.avg);

  if (!avgs.length) return '';

  const worst = avgs[0].k;
  const symCounts: Record<string, number> = {};
  for (const ep of episodes) for (const sym of ep.symptoms) symCounts[sym] = (symCounts[sym] ?? 0) + 1;
  const topSymKey = Object.entries(symCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

  const peakKey = worst === 'morning' ? 'insight_peaks_morning'
    : worst === 'afternoon' ? 'insight_peaks_afternoon'
    : 'insight_peaks_evening';
  const peakText = t(peakKey);
  const symText  = topSymKey ? ` ${t('insight_top_symptom')} ${t(topSymKey)}.` : '';
  return peakText + symText;
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:          { flex: 1, backgroundColor: c.BG },
    content:       { padding: 16, paddingBottom: 40 },
    header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
    title:         { fontSize: 26, fontWeight: '700', color: c.DARK, fontFamily: SERIF },
    streakCard:    { backgroundColor: c.PINK, borderRadius: 20, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
    streakEmoji:   { fontSize: 36 },
    streakNum:     { fontSize: 42, fontWeight: '800', color: c.WHITE, lineHeight: 48 },
    streakLbl:     { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    streakDots:    { flex: 1, flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
    streakDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.25)' },
    streakDotFilled:{ backgroundColor: c.WHITE },
    card:          { backgroundColor: c.SURFACE, borderRadius: 20, padding: 18, marginBottom: 14, ...(c.card as object) },
    cardDone:      { borderWidth: 1.5, borderColor: '#4DB880' },
    cardHeader:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
    cardEmoji:     { fontSize: 32 },
    cardTitle:     { fontSize: 16, fontWeight: '700', color: c.DARK, marginBottom: 2 },
    cardDesc:      { fontSize: 13, color: c.MUTED },
    badge:         { fontSize: 24 },
    progBg:        { height: 8, backgroundColor: c.BG, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
    progFill:      { height: '100%', borderRadius: 4 },
    progLabel:     { fontSize: 12, color: c.MUTED, marginBottom: 12 },
    dayDots:       { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    dayDot:        { width: 12, height: 12, borderRadius: 6, backgroundColor: c.isDark ? '#2E2848' : c.BG },
    insightCard:   { backgroundColor: c.isDark ? '#2A2410' : '#FFF9E6', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#F5A623' },
    insightEmoji:  { fontSize: 28, marginBottom: 8 },
    insightTitle:  { fontSize: 15, fontWeight: '700', color: c.DARK, marginBottom: 6 },
    insightText:   { fontSize: 14, color: c.DARK, lineHeight: 22 },
  });
}
