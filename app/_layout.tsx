import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { I18nContext } from '../src/i18n';
import { t } from '../src/i18n/strings';
import { getSettings, patchSettings, seedIfEmpty } from '../src/storage';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { syncFromRemote } from '../src/storage/sync';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { Lang, Theme } from '../src/types';

if (Constants.executionEnvironment !== 'storeClient') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AppShell() {
  const { session, loading: authLoading } = useAuth();
  const [lang, setLangState]   = useState<Lang>('uz');
  const [theme, setThemeState] = useState<Theme>('system');
  const [ready, setReady]      = useState(false);
  const didNavigate            = useRef(false);

  const [onboardingDone, setOnboardingDone] = useState(false);

  // Bootstrap: load language, seed demo data in dev, then sync from remote if logged in
  useEffect(() => {
    (async () => {
      if (__DEV__) await seedIfEmpty();
      const s = await getSettings();
      setLangState(s.language);
      setThemeState(s.theme ?? 'system');
      setOnboardingDone(s.onboardingCompleted ?? false);
      setReady(true);
    })();
  }, []);

  // When auth state resolves and user is logged in, pull their data
  useEffect(() => {
    if (!authLoading && session?.user) {
      syncFromRemote(session.user.id);
    }
  }, [authLoading, session]);

  // Sync whenever the app returns to foreground
  useEffect(() => {
    if (!session?.user) return;
    const userId = session.user.id;
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') syncFromRemote(userId);
    });
    return () => sub.remove();
  }, [session]);

  // Navigate based on auth + onboarding state — only once on initial load.
  // Sign-in navigation is handled in auth.tsx; sign-out in settings.tsx.
  useEffect(() => {
    if (!ready || authLoading || didNavigate.current) return;
    didNavigate.current = true;
    if (!session) {
      router.replace('/auth');
    } else if (!onboardingDone) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [ready, authLoading]);

  async function setLang(l: Lang) {
    setLangState(l);
    await patchSettings({ language: l });
  }

  async function setTheme(th: Theme) {
    setThemeState(th);
    await patchSettings({ theme: th });
  }

  if (!ready || authLoading) return null;

  return (
    <I18nContext.Provider value={{ lang, setLang, t: (key) => t(key, lang), theme, setTheme }}>
      <SafeAreaProvider>
        <StatusBar style={theme === 'dark' ? 'light' : theme === 'light' ? 'dark' : 'auto'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth"        options={{ headerShown: false }} />
          <Stack.Screen name="onboarding"  options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
          <Stack.Screen name="log"         options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="privacy"      options={{ headerShown: false }} />
          <Stack.Screen name="family-setup" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </I18nContext.Provider>
  );
}
