import { createContext, useContext } from 'react';
import { Lang, Theme } from '../types';
import { t, StringKey } from './strings';

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const I18nContext = createContext<I18nContextValue>({
  lang: 'uz',
  setLang: () => {},
  t: (key) => t(key, 'uz'),
  theme: 'system',
  setTheme: () => {},
});

export function useI18n() {
  return useContext(I18nContext);
}
