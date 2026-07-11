import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { painColor } from '../constants';
import { useColors } from '../theme';
import { useI18n } from '../i18n';
import { Episode } from '../types';

interface Props {
  episodes: Episode[];
  today: string;
}

export default function WeekStrip({ episodes, today }: Props) {
  const { t } = useI18n();
  const c = useColors();
  const weekAbbrs = t('weekdays_short').split(',');

  const todayDate = new Date(today + 'T12:00:00');
  const mondayOffset = (todayDate.getDay() + 6) % 7;
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - mondayOffset);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const s = useMemo(() => StyleSheet.create({
    row:    { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 4 },
    col:    { alignItems: 'center', gap: 6 },
    lbl:    { fontSize: 10, fontWeight: '700', color: c.MUTED, letterSpacing: 0.5 },
    circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    ring:   { borderWidth: 2.5, borderColor: c.BORDER },
    num:    { fontSize: 14, fontWeight: '700', color: c.WHITE },
    dot:    { width: 5, height: 5, borderRadius: 3 },
  }), [c]);

  return (
    <View style={s.row}>
      {days.map((day, i) => {
        const ds = day.toISOString().split('T')[0];
        const isToday = ds === today;
        const dayEps  = episodes.filter(e => e.date === ds);
        const maxPain = dayEps.length ? Math.max(...dayEps.map(e => e.painLevel)) : 0;
        const bg = maxPain > 0 ? painColor(maxPain) : c.isDark ? c.SURFACE : c.DARK;

        return (
          <View key={i} style={s.col}>
            <Text style={s.lbl}>{weekAbbrs[(day.getDay() + 6) % 7]}</Text>
            <View style={[s.circle, { backgroundColor: bg }, isToday && s.ring]}>
              <Text style={s.num}>{day.getDate()}</Text>
            </View>
            {dayEps.length > 1 && (
              <View style={[s.dot, { backgroundColor: painColor(maxPain) }]} />
            )}
          </View>
        );
      })}
    </View>
  );
}
