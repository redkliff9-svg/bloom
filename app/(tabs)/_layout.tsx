import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../src/i18n';
import { useColors } from '../../src/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconsName, focusedName: IoniconsName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : name} size={22} color={color} />
  );
}

export default function TabLayout() {
  const { t } = useI18n();
  const c = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.PINK,
        tabBarInactiveTintColor: c.MUTED,
        tabBarStyle: {
          backgroundColor: c.TAB_BG,
          borderTopColor: c.BORDER,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index"      options={{ title: t('tab_today'),      tabBarIcon: tabIcon('home-outline',      'home') }} />
      <Tabs.Screen name="history"    options={{ title: t('tab_history'),    tabBarIcon: tabIcon('list-outline',      'list') }} />
      <Tabs.Screen name="calendar"   options={{ title: t('tab_calendar'),   tabBarIcon: tabIcon('calendar-outline',  'calendar') }} />
      <Tabs.Screen name="insights"   options={{ title: t('tab_insights'),   tabBarIcon: tabIcon('bar-chart-outline', 'bar-chart') }} />
      <Tabs.Screen name="challenges" options={{ title: t('tab_challenges'), tabBarIcon: tabIcon('trophy-outline',    'trophy') }} />
      <Tabs.Screen name="settings"   options={{ title: t('tab_settings'),   tabBarIcon: tabIcon('settings-outline', 'settings') }} />
    </Tabs>
  );
}
