import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme';
import { useI18n } from '../i18n';
import { AiNudge } from '../hooks/useNudge';

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  streak:      'flame-outline',
  consistency: 'calendar-outline',
  pattern:     'analytics-outline',
  suggestion:  'bulb-outline',
  general:     'sparkles-outline',
};

interface Props {
  nudge: AiNudge;
  onDismiss: () => void;
}

export default function NudgeCard({ nudge, onDismiss }: Props) {
  const c = useColors();
  const { t } = useI18n();
  const s = useMemo(() => makeStyles(c), [c]);
  const icon = TYPE_ICON[nudge.type] ?? 'sparkles-outline';

  return (
    <View style={s.card}>
      <View style={s.topRow}>
        <View style={s.iconWrap}>
          <Ionicons name={icon} size={18} color={c.PINK} />
        </View>
        <Text style={s.label}>{t('ai_nudge_title')}</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color={c.MUTED} />
        </TouchableOpacity>
      </View>
      <Text style={s.message}>{nudge.content}</Text>
      <TouchableOpacity onPress={onDismiss} style={s.dismissBtn}>
        <Text style={s.dismissTxt}>{t('ai_nudge_dismiss')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.isDark ? '#2A1E30' : '#FEF0F5',
      borderRadius: 18,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.isDark ? '#4D2A40' : '#F5C2D6',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: c.isDark ? '#3D2540' : '#FCE0EC',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      flex: 1,
      fontSize: 12,
      fontWeight: '700',
      color: c.MUTED,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    message: {
      fontSize: 14,
      lineHeight: 21,
      color: c.DARK,
    },
    dismissBtn: {
      marginTop: 12,
      alignSelf: 'flex-end',
    },
    dismissTxt: {
      fontSize: 13,
      fontWeight: '700',
      color: c.PINK,
    },
  });
}
