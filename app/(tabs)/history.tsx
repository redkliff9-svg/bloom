import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { SERIF, painColor } from '../../src/constants';
import { useColors } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { deleteEpisode, getActiveMemberId, getEpisodes } from '../../src/storage';
import { Episode } from '../../src/types';

interface DayGroup { date: string; episodes: Episode[]; }

function groupByDay(eps: Episode[]): DayGroup[] {
  const map = new Map<string, Episode[]>();
  for (const ep of eps) {
    if (!map.has(ep.date)) map.set(ep.date, []);
    map.get(ep.date)!.push(ep);
  }
  return Array.from(map.entries())
    .map(([date, episodes]) => ({ date, episodes: episodes.sort((a, b) => b.timestamp - a.timestamp) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function formatDate(ds: string, t: (k: any) => string) {
  const d = new Date(ds + 'T12:00:00');
  const months = t('months').split(',');
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export default function HistoryScreen() {
  const { t } = useI18n();
  const c = useColors();
  const s = useMemo(() => StyleSheet.create({
    safe:       { flex: 1, backgroundColor: c.BG },
    header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title:      { fontSize: 26, fontWeight: '700', color: c.DARK, fontFamily: SERIF },
    count:      { fontSize: 13, color: c.MUTED },
    list:       { padding: 16, paddingBottom: 40 },
    empty:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyIcon:  { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: c.DARK },
  }), [c]);

  const [episodes, setEpisodes] = useState<Episode[]>([]);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [all, activeId] = await Promise.all([getEpisodes(), getActiveMemberId()]);
      setEpisodes(all.filter(e => (e.memberId ?? 'self') === activeId));
    })();
  }, []));

  async function handleDelete(id: string) {
    Alert.alert(t('delete'), t('remove_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
        await deleteEpisode(id);
        setEpisodes(prev => prev.filter(e => e.id !== id));
      }},
    ]);
  }

  function handleEdit(ep: Episode) {
    router.push({ pathname: '/log', params: { editId: ep.id, prefill: JSON.stringify(ep) } });
  }

  const groups = groupByDay(episodes);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>{t('history')}</Text>
        <Text style={s.count}>{episodes.length} {t('total_entries')}</Text>
      </View>

      {groups.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🌸</Text>
          <Text style={s.emptyTitle}>{t('no_entries')}</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.date}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <DayGroupCard group={item} onDelete={handleDelete} onEdit={handleEdit} t={t} c={c} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function DayGroupCard({ group, onDelete, onEdit, t, c }: {
  group: DayGroup;
  onDelete: (id: string) => void;
  onEdit: (ep: Episode) => void;
  t: (k: any) => string;
  c: ReturnType<typeof useColors>;
}) {
  const g = useMemo(() => StyleSheet.create({
    card:        { backgroundColor: c.SURFACE, borderRadius: 20, padding: 16, marginBottom: 14, ...(c.card as object) },
    dayHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    dayDate:     { fontSize: 15, fontWeight: '700', color: c.DARK },
    dayBadge:    { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
    dayBadgeTxt: { color: c.WHITE, fontSize: 12, fontWeight: '700' },
    barBg:       { height: 4, backgroundColor: c.BG, borderRadius: 2, marginBottom: 14, overflow: 'hidden' },
    barFill:     { height: '100%', borderRadius: 2 },
    epRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.BORDER, gap: 8 },
    epLeft:      { width: 70, gap: 4 },
    epTime:      { fontSize: 11, color: c.MUTED, fontWeight: '500' },
    typeTag:     { backgroundColor: c.isDark ? '#3D2030' : '#FDE8EE', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    typeTagDaily:{ backgroundColor: c.isDark ? '#1E3A2A' : '#E8F5E9' },
    typeTagTxt:  { fontSize: 10, color: c.DARK, fontWeight: '600' },
    epMid:       { flex: 1, gap: 3 },
    epDetail:    { fontSize: 12, color: c.DARK, fontWeight: '500' },
    epSymptoms:  { fontSize: 11, color: c.MUTED },
    epRight:     { alignItems: 'flex-end', gap: 4 },
    painCircle:  { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    painCircleTxt:{ fontSize: 12, fontWeight: '700', color: c.WHITE },
    actionRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
    editTxt:     { fontSize: 11, color: c.MUTED, fontWeight: '600' },
    sep:         { fontSize: 11, color: c.MUTED },
    deleteTxt:   { fontSize: 11, color: c.PINK, fontWeight: '600' },
  }), [c]);

  const maxPain = Math.max(...group.episodes.map(e => e.painLevel));
  return (
    <View style={g.card}>
      <View style={g.dayHeader}>
        <Text style={g.dayDate}>{formatDate(group.date, t)}</Text>
        <View style={[g.dayBadge, { backgroundColor: painColor(maxPain) }]}>
          <Text style={g.dayBadgeTxt}>{t('peak')} {maxPain}</Text>
        </View>
      </View>
      <View style={g.barBg}>
        <View style={[g.barFill, { width: `${maxPain * 10}%`, backgroundColor: painColor(maxPain) }]} />
      </View>
      {group.episodes.map(ep => (
        <View key={ep.id} style={g.epRow}>
          <View style={g.epLeft}>
            <Text style={g.epTime}>
              {new Date(ep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <View style={[g.typeTag, ep.type === 'daily' && g.typeTagDaily]}>
              <Text style={g.typeTagTxt}>{ep.type === 'daily' ? t('daily_summary') : t('episode')}</Text>
            </View>
          </View>
          <View style={g.epMid}>
            {ep.painLocations.length > 0 && (
              <Text style={g.epDetail} numberOfLines={1}>{ep.painLocations.map(l => t(l as any)).join(', ')}</Text>
            )}
            {ep.symptoms.length > 0 && (
              <Text style={g.epSymptoms} numberOfLines={1}>{ep.symptoms.map(sym => t(sym as any)).join(' · ')}</Text>
            )}
          </View>
          <View style={g.epRight}>
            <View style={[g.painCircle, { backgroundColor: painColor(ep.painLevel) }]}>
              <Text style={g.painCircleTxt}>{ep.painLevel}</Text>
            </View>
            <View style={g.actionRow}>
              <TouchableOpacity onPress={() => onEdit(ep)}><Text style={g.editTxt}>{t('edit')}</Text></TouchableOpacity>
              <Text style={g.sep}>·</Text>
              <TouchableOpacity onPress={() => onDelete(ep.id)}><Text style={g.deleteTxt}>{t('delete')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
