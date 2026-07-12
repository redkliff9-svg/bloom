import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import Constants from 'expo-constants';
import { scheduleSmartNotifications, requestNotificationPermission, IS_EXPO_GO } from '../../src/coaching/notificationScheduler';
import { SERIF } from '../../src/constants';
import { useColors } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { getEpisodes, getFamilyMembers, getSettings, patchSettings } from '../../src/storage';
import { FamilyMember, Lang, Theme, UserSettings } from '../../src/types';

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = (t ?? '21:00').split(':').map(Number);
  return { h: isNaN(h) ? 21 : h, m: isNaN(m) ? 0 : m };
}
function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildCsv(episodes: any[]): string {
  const header = '"Date","Type","Pain Level","Flow","Pain Locations","Symptoms","Relief Methods","Notes"';
  const rows = episodes.map(ep => [
    ep.date, ep.type, ep.painLevel, ep.flow ?? '',
    (ep.painLocations ?? []).join('; '),
    (ep.symptoms ?? []).join('; '),
    (ep.reliefMethods ?? []).join('; '),
    (ep.notes ?? '').replace(/"/g, '""'),
  ].map(v => `"${v}"`).join(','));
  return [header, ...rows].join('\n');
}

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'uz', label: "O'zbek" },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

const THEMES: { value: Theme; labelKey: 'theme_system' | 'theme_light' | 'theme_dark'; icon: string }[] = [
  { value: 'system', labelKey: 'theme_system', icon: 'phone-portrait-outline' },
  { value: 'light',  labelKey: 'theme_light',  icon: 'sunny-outline' },
  { value: 'dark',   labelKey: 'theme_dark',   icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const { t, lang, setLang, theme, setTheme } = useI18n();
  const { user, signOut } = useAuth();
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [seedBusy, setSeedBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    getSettings().then(setSettings);
    getFamilyMembers().then(setFamilyMembers);
  }, []));

  async function updateSetting(patch: Partial<UserSettings>) {
    const next = await patchSettings(patch);
    setSettings(next);
  }

  async function toggleNotifications(val: boolean) {
    if (val) {
      const granted = await requestNotificationPermission();
      const next = await patchSettings({ notificationsEnabled: granted });
      setSettings(next);
      if (granted) {
        const eps = await getEpisodes();
        await scheduleSmartNotifications(next, eps);
      }
    } else {
      const { default: Notifications } = await import('expo-notifications');
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      const next = await patchSettings({ notificationsEnabled: false });
      setSettings(next);
    }
  }

  async function changeReminderTime(time: string) {
    const next = await patchSettings({ reminderTime: time });
    setSettings(next);
    if (next.notificationsEnabled) {
      const eps = await getEpisodes();
      await scheduleSmartNotifications(next, eps);
    }
  }

  async function toggleDiscreet(val: boolean) {
    const next = await patchSettings({ discreetNotifications: val });
    setSettings(next);
    if (next.notificationsEnabled) {
      const eps = await getEpisodes();
      await scheduleSmartNotifications(next, eps);
    }
  }

  function adjustTime(unit: 'h' | 'm', delta: number) {
    const { h, m } = parseTime(settings?.reminderTime ?? '21:00');
    const newH = unit === 'h' ? (h + delta + 24) % 24 : h;
    const newM = unit === 'm' ? (m + delta + 60) % 60 : m;
    changeReminderTime(fmtTime(newH, newM));
  }

  async function handleExport() {
    const episodes = await getEpisodes();
    if (!episodes.length) {
      Alert.alert('', t('no_data_export'));
      return;
    }
    const csv = buildCsv(episodes);
    await Share.share({ message: csv, title: 'Blooms Data' });
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/auth');
  }

  async function runSeed(kind: 'full' | 'sparse' | 'clear') {
    if (seedBusy) return;
    setSeedBusy(true);
    try {
      const { generateSeedHistory, generateSparseHistory, clearAllData } = await import('../../src/dev/seedData');
      if (kind === 'full')   await generateSeedHistory();
      if (kind === 'sparse') await generateSparseHistory();
      if (kind === 'clear')  await clearAllData();
      Alert.alert('Dev', kind === 'clear' ? 'All data cleared.' : `Seed loaded (${kind}). Restart the tab.`);
    } catch (e: any) {
      Alert.alert('Dev error', String(e?.message ?? e));
    } finally {
      setSeedBusy(false);
    }
  }

  if (!settings) return null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{t('settings')}</Text>
        </View>

        {/* Language */}
        <Text style={s.sectionLabel}>{t('language')}</Text>
        <View style={s.card}>
          {LANGUAGES.map((l, i) => (
            <TouchableOpacity
              key={l.code}
              style={[s.langRow, i < LANGUAGES.length - 1 && s.rowBorder]}
              onPress={() => { setLang(l.code); updateSetting({ language: l.code }); }}
            >
              <Text style={[s.langLabel, lang === l.code && { color: c.PINK }]}>{l.label}</Text>
              {lang === l.code && <Text style={s.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Appearance / Theme */}
        <Text style={s.sectionLabel}>{t('theme')}</Text>
        <View style={s.card}>
          {THEMES.map((th, i) => (
            <TouchableOpacity
              key={th.value}
              style={[s.langRow, i < THEMES.length - 1 && s.rowBorder]}
              onPress={() => setTheme(th.value)}
            >
              <View style={s.themeRow}>
                <Ionicons name={th.icon as any} size={18} color={theme === th.value ? c.PINK : c.MUTED} style={{ marginRight: 10 }} />
                <Text style={[s.langLabel, theme === th.value && { color: c.PINK }]}>{t(th.labelKey)}</Text>
              </View>
              {theme === th.value && <Text style={s.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications */}
        <Text style={s.sectionLabel}>{t('notifications')}</Text>
        <View style={s.card}>
          <View style={[s.switchRow, s.rowBorder]}>
            <Text style={s.switchLabel}>{t('enable_notifs')}</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: c.BORDER, true: c.PINK }}
              thumbColor={c.WHITE}
            />
          </View>

          {settings.notificationsEnabled && (
            <>
              <View style={s.reminderRow}>
                <Text style={s.stepLabel}>{t('reminder_time')}</Text>
                <View style={s.timePicker}>
                  <View style={s.timeUnit}>
                    <TouchableOpacity style={s.stepBtn} onPress={() => adjustTime('h', 1)}>
                      <Text style={s.stepBtnTxt}>+</Text>
                    </TouchableOpacity>
                    <Text style={s.timeVal}>
                      {String(parseTime(settings.reminderTime ?? '21:00').h).padStart(2, '0')}
                    </Text>
                    <TouchableOpacity style={s.stepBtn} onPress={() => adjustTime('h', -1)}>
                      <Text style={s.stepBtnTxt}>−</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={s.timeSep}>:</Text>
                  <View style={s.timeUnit}>
                    <TouchableOpacity style={s.stepBtn} onPress={() => adjustTime('m', 1)}>
                      <Text style={s.stepBtnTxt}>+</Text>
                    </TouchableOpacity>
                    <Text style={s.timeVal}>
                      {String(parseTime(settings.reminderTime ?? '21:00').m).padStart(2, '0')}
                    </Text>
                    <TouchableOpacity style={s.stepBtn} onPress={() => adjustTime('m', -1)}>
                      <Text style={s.stepBtnTxt}>−</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={[s.switchRow, { borderTopWidth: 1, borderTopColor: c.BORDER }]}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={s.switchLabel}>{t('discreet_notifs')}</Text>
                  <Text style={s.switchSub}>{t('discreet_notifs_sub')}</Text>
                </View>
                <Switch
                  value={settings.discreetNotifications !== false}
                  onValueChange={toggleDiscreet}
                  trackColor={{ false: c.BORDER, true: c.PINK }}
                  thumbColor={c.WHITE}
                />
              </View>
            </>
          )}

          {IS_EXPO_GO && (
            <View style={s.expoGoNote}>
              <Ionicons name="information-circle-outline" size={15} color={c.MUTED} style={{ marginTop: 1 }} />
              <Text style={s.expoGoTxt}>{t('notifs_expo_go')}</Text>
            </View>
          )}
        </View>

        {/* Cycle settings */}
        <Text style={s.sectionLabel}>{t('cycle_info')}</Text>
        <View style={s.card}>
          <View style={[s.stepRow, s.rowBorder]}>
            <Text style={s.stepLabel}>{t('cycle_length')}</Text>
            <View style={s.stepper}>
              <TouchableOpacity style={s.stepBtn} onPress={() => updateSetting({ cycleLength: Math.max(21, settings.cycleLength - 1) })}>
                <Text style={s.stepBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={s.stepVal}>{settings.cycleLength}d</Text>
              <TouchableOpacity style={s.stepBtn} onPress={() => updateSetting({ cycleLength: Math.min(45, settings.cycleLength + 1) })}>
                <Text style={s.stepBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.stepRow}>
            <Text style={s.stepLabel}>{t('period_length')}</Text>
            <View style={s.stepper}>
              <TouchableOpacity style={s.stepBtn} onPress={() => updateSetting({ periodLength: Math.max(2, settings.periodLength - 1) })}>
                <Text style={s.stepBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={s.stepVal}>{settings.periodLength}d</Text>
              <TouchableOpacity style={s.stepBtn} onPress={() => updateSetting({ periodLength: Math.min(10, settings.periodLength + 1) })}>
                <Text style={s.stepBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Family */}
        <Text style={s.sectionLabel}>{t('family_mode')}</Text>
        <View style={s.card}>
          {familyMembers.length === 0 ? (
            <TouchableOpacity style={s.actionRow} onPress={() => router.push('/family-setup')}>
              <Ionicons name="people-outline" size={18} color={c.DARK} style={s.actionIcon} />
              <Text style={s.actionTxt}>{t('me_and_family')}</Text>
              <Ionicons name="chevron-forward" size={16} color={c.MUTED} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          ) : (
            <>
              {familyMembers.map((m, i) => (
                <View key={m.id} style={[s.memberRow, i < familyMembers.length - 1 && s.rowBorder]}>
                  <View style={[s.memberDot, { backgroundColor: m.color }]} />
                  <Text style={s.memberName}>{m.name}</Text>
                  <Text style={s.memberRelation}>{t(m.relation as any)}</Text>
                </View>
              ))}
              <TouchableOpacity style={[s.actionRow, { borderTopWidth: 1, borderTopColor: c.BORDER }]} onPress={() => router.push('/family-setup')}>
                <Ionicons name="pencil-outline" size={18} color={c.DARK} style={s.actionIcon} />
                <Text style={s.actionTxt}>{t('add_member')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Account */}
        <Text style={s.sectionLabel}>{t('account')}</Text>
        <View style={s.card}>
          {user && (
            <View style={[s.stepRow, s.rowBorder]}>
              <Text style={s.stepLabel} numberOfLines={1}>{user.email}</Text>
            </View>
          )}
          <TouchableOpacity style={[s.actionRow, s.rowBorder]} onPress={handleExport}>
            <Ionicons name="share-outline" size={18} color={c.DARK} style={s.actionIcon} />
            <Text style={s.actionTxt}>{t('export_data')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionRow, s.rowBorder]} onPress={() => router.push('/privacy')}>
            <Ionicons name="document-text-outline" size={18} color={c.DARK} style={s.actionIcon} />
            <Text style={s.actionTxt}>{t('privacy_policy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionRow} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={18} color="#C4604A" style={s.actionIcon} />
            <Text style={[s.actionTxt, { color: '#C4604A' }]}>{t('sign_out')}</Text>
          </TouchableOpacity>
        </View>

        {/* Dev Tools — only in __DEV__ builds */}
        {__DEV__ && (
          <>
            <Text style={s.sectionLabel}>Dev Tools</Text>
            <View style={s.card}>
              {[
                { label: 'Load full history (4 cycles)',  kind: 'full'   as const },
                { label: 'Load sparse history (5 logs)',  kind: 'sparse' as const },
                { label: 'Clear all data',                kind: 'clear'  as const },
              ].map(({ label, kind }, i, arr) => (
                <TouchableOpacity
                  key={kind}
                  style={[s.actionRow, i < arr.length - 1 && s.rowBorder, seedBusy && { opacity: 0.5 }]}
                  onPress={() => runSeed(kind)}
                  disabled={seedBusy}
                >
                  <Ionicons
                    name={kind === 'clear' ? 'trash-outline' : 'flask-outline'}
                    size={18}
                    color={kind === 'clear' ? '#C4604A' : c.DARK}
                    style={s.actionIcon}
                  />
                  <Text style={[s.actionTxt, kind === 'clear' && { color: '#C4604A' }]}>{label}</Text>
                  {seedBusy && <ActivityIndicator size="small" color={c.MUTED} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={s.infoCard}>
          <Text style={s.infoEmoji}>🌸</Text>
          <Text style={s.infoName}>Blooms</Text>
          <Text style={s.infoVersion}>v1.0.0 · SDK 54</Text>
          <Text style={s.infoTagline}>{t('welcome_sub')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:         { flex: 1, backgroundColor: c.BG },
    content:      { padding: 16, paddingBottom: 60 },
    header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
    title:        { fontSize: 26, fontWeight: '700', color: c.DARK, fontFamily: SERIF },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: c.MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4, marginTop: 16 },
    card:         { backgroundColor: c.SURFACE, borderRadius: 20, ...(c.card as object), overflow: 'hidden', marginBottom: 4 },
    langRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    rowBorder:    { borderBottomWidth: 1, borderBottomColor: c.BORDER },
    langLabel:    { fontSize: 16, fontWeight: '600', color: c.DARK },
    check:        { fontSize: 16, color: c.PINK, fontWeight: '700' },
    themeRow:     { flexDirection: 'row', alignItems: 'center' },
    switchRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    switchLabel:  { fontSize: 15, color: c.DARK, fontWeight: '500', flex: 1 },
    stepRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    stepLabel:    { fontSize: 15, color: c.DARK, fontWeight: '500' },
    stepper:      { flexDirection: 'row', alignItems: 'center', gap: 16 },
    stepBtn:      { width: 34, height: 34, borderRadius: 17, backgroundColor: c.BG, alignItems: 'center', justifyContent: 'center' },
    stepBtnTxt:   { fontSize: 20, color: c.DARK, fontWeight: '600' },
    stepVal:      { fontSize: 16, fontWeight: '700', color: c.DARK, minWidth: 36, textAlign: 'center' },
    reminderRow:  { padding: 16 },
    timePicker:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 },
    timeUnit:     { alignItems: 'center', gap: 8 },
    timeVal:      { fontSize: 32, fontWeight: '800', color: c.DARK, minWidth: 54, textAlign: 'center' },
    timeSep:      { fontSize: 32, fontWeight: '800', color: c.DARK, marginBottom: 2 },
    actionRow:    { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    actionIcon:   { width: 22 },
    actionTxt:    { fontSize: 15, fontWeight: '600', color: c.DARK },
    memberRow:    { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
    memberDot:    { width: 14, height: 14, borderRadius: 7 },
    memberName:   { fontSize: 15, fontWeight: '600', color: c.DARK, flex: 1 },
    memberRelation:{ fontSize: 12, color: c.MUTED },
    switchSub:    { fontSize: 11, color: c.MUTED, marginTop: 2 },
    expoGoNote:   { flexDirection: 'row', gap: 8, padding: 14, borderTopWidth: 1, borderTopColor: c.BORDER },
    expoGoTxt:    { flex: 1, fontSize: 12, color: c.MUTED, lineHeight: 17 },
    infoCard:     { alignItems: 'center', marginTop: 32, paddingVertical: 24 },
    infoEmoji:    { fontSize: 40, marginBottom: 8 },
    infoName:     { fontSize: 20, fontWeight: '800', color: c.DARK },
    infoVersion:  { fontSize: 12, color: c.MUTED, marginTop: 4 },
    infoTagline:  { fontSize: 13, color: c.MUTED, marginTop: 8, textAlign: 'center' },
  });
}
