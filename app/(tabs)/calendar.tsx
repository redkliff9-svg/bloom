import { useCallback, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { painColor } from '../../src/constants';
import { useColors } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { getActiveMemberId, getEpisodes, getSettings } from '../../src/storage';
import { Episode, UserSettings } from '../../src/types';

const { width } = Dimensions.get('window');
const CELL_SIZE = Math.floor((width - 32) / 7);

function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const offset   = (firstDow + 6) % 7; // Monday-first
  const days     = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null)];
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

function estimatePeriodDay(ds: string, settings: UserSettings): boolean {
  const start = new Date(settings.lastPeriodStart + 'T12:00:00');
  const d     = new Date(ds + 'T12:00:00');
  const diff  = Math.round((d.getTime() - start.getTime()) / 86400000);
  const dayOfCycle = ((diff % settings.cycleLength) + settings.cycleLength) % settings.cycleLength;
  return dayOfCycle < settings.periodLength;
}

export default function CalendarScreen() {
  const { t } = useI18n();
  const c = useColors();
  const s = useMemo(() => StyleSheet.create({
    safe:       { flex: 1, backgroundColor: c.BG },
    header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
    title:      { fontSize: 22, fontWeight: '700', color: c.DARK },
    monthNav:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    navBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: c.SURFACE, alignItems: 'center', justifyContent: 'center', ...(c.card as object) },
    navArrow:   { fontSize: 24, color: c.DARK, fontWeight: '500', lineHeight: 28 },
    monthLabel: { fontSize: 17, fontWeight: '700', color: c.DARK },
    weekRow:    { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 6 },
    weekCell:   { width: CELL_SIZE, alignItems: 'center' },
    weekLbl:    { fontSize: 11, fontWeight: '700', color: c.MUTED, textTransform: 'uppercase' },
    gridWrap:   { paddingHorizontal: 16, paddingBottom: 24 },
    calRow:     { flexDirection: 'row', marginBottom: 4 },
    cellSlot:   { width: CELL_SIZE, height: CELL_SIZE, padding: 2 },
    cell:       { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    cellPeriod: { backgroundColor: c.isDark ? '#3D2030' : '#FDE8EE' },
    cellToday:  { borderWidth: 2, borderColor: c.PINK },
    dayNum:     { fontSize: 13, fontWeight: '600', color: c.DARK },
    dayNumWhite:{ color: c.WHITE },
    dayNumPink: { color: c.PINK },
    periodDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: c.PINK, marginTop: 1 },
    periodDotWhite: { backgroundColor: 'rgba(255,255,255,0.7)' },
    legend:     { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingTop: 16, paddingHorizontal: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot:  { width: 14, height: 14, borderRadius: 7 },
    legendLbl:  { fontSize: 12, color: c.MUTED },
  }), [c]);
  const today  = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [episodes, setEpisodes]  = useState<Episode[]>([]);
  const [settings, setSettings]  = useState<UserSettings | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [all, s, activeId] = await Promise.all([getEpisodes(), getSettings(), getActiveMemberId()]);
      setEpisodes(all.filter(e => (e.memberId ?? 'self') === activeId));
      setSettings(s);
    })();
  }, []));

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const painMap: Record<string, number> = {};
  for (const ep of episodes) {
    painMap[ep.date] = Math.max(painMap[ep.date] ?? 0, ep.painLevel);
  }

  const todayStr   = today.toISOString().split('T')[0];
  const cells      = buildMonthCells(year, month);
  const rows       = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const weekdays   = t('weekdays_short').split(',');
  const monthNames = t('months').split(',');
  const monthLabel = `${monthNames[month]} ${year}`;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>{t('tab_calendar')}</Text>
      </View>

      {/* Month navigation */}
      <View style={s.monthNav}>
        <TouchableOpacity
          style={s.navBtn}
          onPress={() => setViewDate(new Date(year, month - 1, 1))}
        >
          <Text style={s.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity
          style={s.navBtn}
          onPress={() => setViewDate(new Date(year, month + 1, 1))}
        >
          <Text style={s.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday labels */}
      <View style={s.weekRow}>
        {weekdays.map((d, i) => (
          <View key={i} style={s.weekCell}>
            <Text style={s.weekLbl}>{d}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.gridWrap} showsVerticalScrollIndicator={false}>
        {rows.map((row, ri) => (
          <View key={ri} style={s.calRow}>
            {row.map((day, ci) => {
              if (!day) return <View key={ci} style={s.cellSlot} />;

              const ds       = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const pain     = painMap[ds] ?? 0;
              const isToday  = ds === todayStr;
              const isPeriod = settings ? estimatePeriodDay(ds, settings) : false;
              const hasPain  = pain > 0;

              return (
                <View key={ci} style={s.cellSlot}>
                  <View style={[
                    s.cell,
                    hasPain      && { backgroundColor: painColor(pain) },
                    !hasPain && isPeriod && s.cellPeriod,
                    isToday      && s.cellToday,
                  ]}>
                    <Text style={[
                      s.dayNum,
                      hasPain      && s.dayNumWhite,
                      !hasPain && isPeriod && s.dayNumPink,
                    ]}>
                      {day}
                    </Text>
                    {isPeriod && (
                      <View style={[s.periodDot, hasPain && s.periodDotWhite]} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Legend */}
        <View style={s.legend}>
          {[
            { color: '#4DB880', label: t('mild') },
            { color: '#F5A623', label: t('moderate') },
            { color: '#EF5675', label: t('severe') },
          ].map(({ color, label }) => (
            <View key={label} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: color }]} />
              <Text style={s.legendLbl}>{label}</Text>
            </View>
          ))}
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: c.isDark ? '#3D2030' : '#FDE8EE', borderWidth: 1, borderColor: c.isDark ? '#6B304A' : '#F5C2CC' }]} />
            <Text style={[s.legendLbl, { color: c.PINK }]}>{t('period_active')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

