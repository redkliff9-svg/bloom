import { useMemo, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { SERIF } from '../src/constants';
import { useColors } from '../src/theme';
import { useI18n } from '../src/i18n';
import { syncFromRemote, uploadLocalData } from '../src/storage/sync';
import { setCurrentUser } from '../src/storage';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function classifyError(msg: string): 'email' | 'password' | 'confirm' | 'general' {
  const m = msg.toLowerCase();
  if (m.includes('not confirmed') || m.includes('confirm'))  return 'confirm';
  if (m.includes('invalid login') || m.includes('credentials') || m.includes('wrong password')) return 'password';
  if (m.includes('user not found') || m.includes('invalid email')) return 'email';
  return 'general';
}

export default function AuthScreen() {
  const { t } = useI18n();
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const [mode, setMode]           = useState<'signin' | 'signup'>('signin');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [emailErr, setEmailErr]   = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [generalErr, setGeneralErr]   = useState('');
  const [checkInbox, setCheckInbox]   = useState(false);

  function clearErrors() { setEmailErr(''); setPasswordErr(''); setGeneralErr(''); }

  async function handleSubmit() {
    clearErrors();

    if (!EMAIL_RE.test(email.trim())) {
      setEmailErr(t('email_invalid'));
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setPasswordErr(t('password_short'));
      return;
    }
    if (!password.trim()) {
      setPasswordErr(t('password_invalid'));
      return;
    }

    setLoading(true);

    if (mode === 'signup') {
      const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      if (err) {
        const kind = classifyError(err.message);
        if (kind === 'email') setEmailErr(t('email_invalid'));
        else if (kind === 'password') setPasswordErr(t('password_invalid'));
        else setGeneralErr(err.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        setCurrentUser(data.user.id);
        uploadLocalData(data.user.id);
        router.replace('/family-setup');
      } else {
        setCheckInbox(true);
      }
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) {
        const kind = classifyError(err.message);
        if (kind === 'confirm') setGeneralErr(t('confirm_email_err'));
        else if (kind === 'email') setEmailErr(t('email_invalid'));
        else setPasswordErr(t('password_invalid'));
        setLoading(false);
        return;
      }
      if (data.user) {
        setCurrentUser(data.user.id);
        syncFromRemote(data.user.id);
        router.replace('/(tabs)');
        return;
      }
    }

    setLoading(false);
  }

  if (checkInbox) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={[s.kav, { alignItems: 'center' }]}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>📬</Text>
          <Text style={[s.appName, { marginBottom: 12 }]}>{t('check_inbox')}</Text>
          <Text style={[s.tagline, { marginBottom: 32, paddingHorizontal: 24 }]}>
            {t('check_inbox_body')}
          </Text>
          <TouchableOpacity style={s.btn} onPress={() => { setCheckInbox(false); setMode('signin'); }}>
            <Text style={s.btnTxt}>{t('sign_in')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.top}>
          <Text style={s.logo}>🌸</Text>
          <Text style={s.appName}>Blooms</Text>
          <Text style={s.tagline}>{t('welcome_sub')}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>
            {mode === 'signin' ? t('sign_in') : t('sign_up')}
          </Text>

          <TextInput
            style={[s.input, !!emailErr && s.inputErr]}
            value={email}
            onChangeText={v => { setEmail(v); setEmailErr(''); }}
            placeholder={t('email')}
            placeholderTextColor={c.MUTED}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          {!!emailErr && <Text style={s.fieldErr}>{emailErr}</Text>}

          <View style={s.pwdRow}>
            <TextInput
              style={[s.input, s.pwdInput, !!passwordErr && s.inputErr]}
              value={password}
              onChangeText={v => { setPassword(v); setPasswordErr(''); }}
              placeholder={t('password')}
              placeholderTextColor={c.MUTED}
              secureTextEntry={!showPwd}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPwd(v => !v)}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.MUTED} />
            </TouchableOpacity>
          </View>
          {!!passwordErr && <Text style={s.fieldErr}>{passwordErr}</Text>}

          {!!generalErr && <Text style={s.error}>{generalErr}</Text>}

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={c.WHITE} />
              : <Text style={s.btnTxt}>{mode === 'signin' ? t('sign_in') : t('sign_up')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={s.switchBtn}
            onPress={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); clearErrors(); }}
          >
            <Text style={s.switchTxt}>
              {mode === 'signin' ? t('no_account') : t('have_account')}
              {'  '}
              <Text style={{ color: c.PINK, fontWeight: '700' }}>
                {mode === 'signin' ? t('sign_up') : t('sign_in')}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:     { flex: 1, backgroundColor: c.BG },
    kav:      { flex: 1, justifyContent: 'center', padding: 24 },
    top:      { alignItems: 'center', marginBottom: 36 },
    logo:     { fontSize: 56, marginBottom: 10 },
    appName:  { fontFamily: SERIF, fontSize: 30, fontWeight: '700', color: c.DARK, marginBottom: 6 },
    tagline:  { fontSize: 14, color: c.MUTED, textAlign: 'center' },
    card:     { backgroundColor: c.SURFACE, borderRadius: 24, padding: 24, ...(c.card as object) },
    cardTitle:{ fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: c.DARK, marginBottom: 20 },
    input:    { backgroundColor: c.BG, borderRadius: 14, padding: 15, fontSize: 15, color: c.DARK, marginBottom: 4 },
    inputErr: { borderWidth: 1, borderColor: '#C4604A' },
    fieldErr: { fontSize: 12, color: '#C4604A', marginBottom: 10, marginLeft: 4 },
    pwdRow:   { position: 'relative', marginBottom: 0 },
    pwdInput: { paddingRight: 52 },
    eyeBtn:   { position: 'absolute', right: 14, top: 0, bottom: 4, justifyContent: 'center' },
    error:    { fontSize: 13, color: '#C4604A', marginBottom: 12, textAlign: 'center', marginTop: 4 },
    btn:      { backgroundColor: c.PINK, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 },
    btnTxt:   { color: c.WHITE, fontSize: 16, fontWeight: '700' },
    switchBtn:{ alignItems: 'center', paddingTop: 18 },
    switchTxt:{ fontSize: 14, color: c.MUTED },
  });
}
