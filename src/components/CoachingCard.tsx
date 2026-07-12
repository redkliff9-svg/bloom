import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '../theme';
import { CoachingNudge } from '../coaching/nudgeEngine';

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  period_heat:         'flame-outline',
  period_hydration:    'water-outline',
  period_rest:         'bed-outline',
  pre_stock:           'bag-outline',
  pre_prep:            'calendar-outline',
  ovulation_energy:    'flash-outline',
  luteal_mood:         'heart-outline',
  luteal_cravings:     'nutrition-outline',
  pattern_peak_day:    'analytics-outline',
  pattern_top_symptom: 'pulse-outline',
  pattern_morning:     'sunny-outline',
  streak_current:      'flame-outline',
  streak_milestone:    'trophy-outline',
  reengage_gentle:     'leaf-outline',
  reengage_data:       'bar-chart-outline',
  edu_magnesium:       'flask-outline',
  edu_sleep:           'moon-outline',
  edu_breathing:       'aperture-outline',
  edu_cycle_phases:    'infinite-outline',
  edu_heat_science:    'thermometer-outline',
};

interface Props {
  nudge: CoachingNudge;
  onDismiss: () => void;
}

export default function CoachingCard({ nudge, onDismiss }: Props) {
  const c   = useColors();
  const s   = useMemo(() => makeStyles(c), [c]);
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const icon = CATEGORY_ICON[nudge.id] ?? 'sparkles-outline';

  function handleAction() {
    onDismiss();
    if (nudge.actionRoute) {
      router.push(nudge.actionRoute as any);
    }
  }

  return (
    <Animated.View style={[s.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={s.topRow}>
        <View style={s.iconWrap}>
          <Ionicons name={icon} size={16} color={c.PINK} />
        </View>
        <Text style={s.label}>blooms coaching</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={17} color={c.MUTED} />
        </TouchableOpacity>
      </View>

      <Text style={s.message}>{nudge.text}</Text>

      <View style={s.footer}>
        <TouchableOpacity style={s.actionBtn} onPress={handleAction}>
          <Text style={s.actionTxt}>{nudge.action}</Text>
          <Ionicons name="arrow-forward" size={13} color={c.PINK} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={s.dismissTxt}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.isDark ? '#1E1A2E' : '#F5F0FF',
      borderRadius: 18,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.isDark ? '#3A3060' : '#DDD0F5',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.isDark ? '#2E2848' : '#EDE0FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      flex: 1,
      fontSize: 11,
      fontWeight: '700',
      color: c.MUTED,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    message: {
      fontSize: 14,
      lineHeight: 21,
      color: c.DARK,
      marginBottom: 12,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.isDark ? '#2E2848' : '#EDE0FF',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    actionTxt: {
      fontSize: 13,
      fontWeight: '700',
      color: c.PINK,
    },
    dismissTxt: {
      fontSize: 13,
      color: c.MUTED,
      paddingHorizontal: 8,
    },
  });
}
