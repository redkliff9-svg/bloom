import { useMemo, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SERIF } from '../src/constants';
import { useColors } from '../src/theme';
import { useI18n } from '../src/i18n';
import { createMember, saveFamilyMembers } from '../src/storage';
import { FamilyMember } from '../src/types';

const RELATIONS = ['relation_daughter', 'relation_son', 'relation_sister', 'relation_mother', 'relation_other'] as const;
const RELATION_EMOJIS: Record<string, string> = {
  relation_daughter: '👧', relation_son: '👦', relation_sister: '👩',
  relation_mother: '👩‍🦳', relation_other: '👤',
};

interface MemberDraft { name: string; relation: string; }

export default function FamilySetupScreen() {
  const { t } = useI18n();
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const [step, setStep]       = useState<'question' | 'members'>('question');
  const [members, setMembers] = useState<MemberDraft[]>([{ name: '', relation: 'relation_daughter' }]);

  function addMember() {
    setMembers(m => [...m, { name: '', relation: 'relation_other' }]);
  }

  function updateMember(i: number, patch: Partial<MemberDraft>) {
    setMembers(m => m.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  }

  function removeMember(i: number) {
    setMembers(m => m.filter((_, idx) => idx !== i));
  }

  async function handleDone() {
    const saved: FamilyMember[] = members
      .filter(m => m.name.trim())
      .map((m, i) => createMember(m.name.trim(), m.relation, i));
    await saveFamilyMembers(saved);
    router.replace('/(tabs)');
  }

  async function handleJustMe() {
    await saveFamilyMembers([]);
    router.replace('/(tabs)');
  }

  if (step === 'question') {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.center}>
          <Text style={s.emoji}>👨‍👩‍👧</Text>
          <Text style={s.title}>{t('family_question')}</Text>
          <Text style={s.sub}>{t('family_question_sub')}</Text>

          <TouchableOpacity style={s.primaryBtn} onPress={() => setStep('members')}>
            <Text style={s.primaryTxt}>👨‍👩‍👧  {t('me_and_family')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={handleJustMe}>
            <Text style={s.secondaryTxt}>🙋  {t('just_me')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>{t('family_mode')}</Text>
        <Text style={s.sub}>{t('add_member')}</Text>

        {members.map((m, i) => (
          <View key={i} style={s.memberCard}>
            <View style={s.memberHeader}>
              <Text style={s.memberNum}>#{i + 1}</Text>
              {members.length > 1 && (
                <TouchableOpacity onPress={() => removeMember(i)}>
                  <Text style={s.removeBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={s.input}
              value={m.name}
              onChangeText={v => updateMember(i, { name: v })}
              placeholder={t('name_placeholder')}
              placeholderTextColor={c.MUTED}
            />

            <Text style={s.relationLabel}>{t('member_relation')}</Text>
            <View style={s.relationRow}>
              {RELATIONS.map(rel => (
                <TouchableOpacity
                  key={rel}
                  style={[s.relChip, m.relation === rel && s.relChipActive]}
                  onPress={() => updateMember(i, { relation: rel })}
                >
                  <Text style={s.relEmoji}>{RELATION_EMOJIS[rel]}</Text>
                  <Text style={[s.relTxt, m.relation === rel && s.relTxtActive]}>
                    {t(rel as any)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={s.addBtn} onPress={addMember}>
          <Text style={s.addTxt}>+  {t('add_member')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.primaryBtn, { marginTop: 8 }]}
          onPress={handleDone}
          disabled={members.every(m => !m.name.trim())}
        >
          <Text style={s.primaryTxt}>{t('continue_to_app')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.secondaryBtn} onPress={handleJustMe}>
          <Text style={s.secondaryTxt}>{t('skip')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:          { flex: 1, backgroundColor: c.BG },
    center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
    content:       { padding: 24, paddingBottom: 48 },
    emoji:         { fontSize: 64, marginBottom: 20 },
    title:         { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: c.DARK, textAlign: 'center', marginBottom: 10 },
    sub:           { fontSize: 14, color: c.MUTED, textAlign: 'center', marginBottom: 36, lineHeight: 20 },
    primaryBtn:    { backgroundColor: c.PINK, borderRadius: 16, padding: 17, alignItems: 'center', width: '100%', marginBottom: 12 },
    primaryTxt:    { color: c.WHITE, fontSize: 16, fontWeight: '700' },
    secondaryBtn:  { backgroundColor: c.SURFACE, borderRadius: 16, padding: 16, alignItems: 'center', width: '100%', ...(c.card as object) },
    secondaryTxt:  { color: c.MUTED, fontSize: 15, fontWeight: '600' },
    memberCard:    { backgroundColor: c.SURFACE, borderRadius: 20, padding: 18, marginBottom: 14, ...(c.card as object) },
    memberHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    memberNum:     { fontSize: 13, fontWeight: '700', color: c.PINK },
    removeBtn:     { fontSize: 14, color: c.MUTED, fontWeight: '600', padding: 4 },
    input:         { backgroundColor: c.BG, borderRadius: 12, padding: 14, fontSize: 15, color: c.DARK, marginBottom: 14 },
    relationLabel: { fontSize: 12, fontWeight: '700', color: c.MUTED, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
    relationRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    relChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: c.isDark ? '#2A2848' : c.BG, borderWidth: 1.5, borderColor: 'transparent' },
    relChipActive: { backgroundColor: c.isDark ? '#3D2A50' : '#F0EAF7', borderColor: c.PINK },
    relEmoji:      { fontSize: 16 },
    relTxt:        { fontSize: 12, fontWeight: '600', color: c.MUTED },
    relTxtActive:  { color: c.PINK },
    addBtn:        { backgroundColor: c.SURFACE, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 16, ...(c.card as object) },
    addTxt:        { fontSize: 14, fontWeight: '700', color: c.DARK },
  });
}
