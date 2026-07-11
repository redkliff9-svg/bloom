import { useColorScheme } from 'react-native';
import { useContext } from 'react';
import { I18nContext } from './i18n';

export interface Colors {
  BG: string;
  SURFACE: string;
  DARK: string;
  MUTED: string;
  PINK: string;
  LAVENDER: string;
  WHITE: string;
  BORDER: string;
  TAB_BG: string;
  isDark: boolean;
  card: object;
}

export const LIGHT: Colors = {
  BG:       '#EAE4DB',
  SURFACE:  '#FFFFFF',
  DARK:     '#2A2018',
  MUTED:    '#96897F',
  PINK:     '#8B6BA0',
  LAVENDER: '#D4BFEA',
  WHITE:    '#FFFFFF',
  BORDER:   '#E4E6F0',
  TAB_BG:   '#FFFFFF',
  isDark:   false,
  card: {
    elevation: 2,
    shadowColor: '#6B4F3A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
  },
};

export const DARK: Colors = {
  BG:       '#1A1825',
  SURFACE:  '#252236',
  DARK:     '#EDE8E3',
  MUTED:    '#9590A8',
  PINK:     '#B09DC8',
  LAVENDER: '#3D3460',
  WHITE:    '#FFFFFF',
  BORDER:   '#2F2B44',
  TAB_BG:   '#1E1C2A',
  isDark:   true,
  card: {
    elevation: 0,
    borderWidth: 1,
    borderColor: '#2F2B44',
  },
};

export function useColors(): Colors {
  const { theme } = useContext(I18nContext);
  const system = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && system === 'dark');
  return isDark ? DARK : LIGHT;
}
