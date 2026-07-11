import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SERIF } from '../src/constants';
import { useColors } from '../src/theme';
import { useI18n } from '../src/i18n';

export default function PrivacyScreen() {
  const { t } = useI18n();
  const c = useColors();
  const s = useMemo(() => StyleSheet.create({
    safe:    { flex: 1, backgroundColor: c.BG },
    header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    title:   { fontSize: 18, fontWeight: '700', color: c.DARK, fontFamily: SERIF },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.SURFACE, alignItems: 'center', justifyContent: 'center', ...(c.card as object) },
    content: { padding: 16, paddingBottom: 40 },
    updated: { textAlign: 'center', fontSize: 11, color: c.MUTED, marginTop: 24 },
    card:    { backgroundColor: c.SURFACE, borderRadius: 20, padding: 18, marginBottom: 12, ...(c.card as object) },
    heading: { fontSize: 15, fontWeight: '700', color: c.DARK, marginBottom: 8 },
    body:    { fontSize: 14, color: c.MUTED, lineHeight: 22 },
  }), [c]);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={c.DARK} />
        </TouchableOpacity>
        <Text style={s.title}>{t('privacy_policy')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {([
          ['pp_storage_title', 'pp_storage_body'],
          ['pp_notif_title',   'pp_notif_body'],
          ['pp_health_title',  'pp_health_body'],
          ['pp_export_title',  'pp_export_body'],
          ['pp_delete_title',  'pp_delete_body'],
          ['pp_contact_title', 'pp_contact_body'],
        ] as const).map(([hk, bk]) => (
          <View key={hk} style={s.card}>
            <Text style={s.heading}>{t(hk)}</Text>
            <Text style={s.body}>{t(bk)}</Text>
          </View>
        ))}
        <Text style={s.updated}>{t('pp_updated')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
