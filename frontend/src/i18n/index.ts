import { create } from 'zustand';
import zh from './locales/zh';
import en from './locales/en';

export type LocaleKey = 'zh' | 'en';
export type TranslationDict = typeof zh;

const dictionaries: Record<LocaleKey, TranslationDict> = { zh, en };

const getInitialLanguage = (): LocaleKey => {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('biunote-language') : null;
  if (saved === 'zh' || saved === 'en') return saved as LocaleKey;
  return typeof navigator !== 'undefined' && navigator.language?.startsWith('en') ? 'en' : 'zh';
};

interface I18nStore {
  language: LocaleKey;
  setLanguage: (lang: LocaleKey) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useI18n = create<I18nStore>((set, get) => ({
  language: getInitialLanguage(),
  setLanguage: (lang: LocaleKey) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('biunote-language', lang);
    }
    set({ language: lang });
  },
  t: (key: string, params?: Record<string, string | number>) => {
    const lang = get().language;
    const keys = key.split('.');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolve = (obj: any, pathKeys: string[]): any =>
      pathKeys.reduce((acc, k) => acc?.[k], obj);

    const val = resolve(dictionaries[lang], keys) ?? resolve(dictionaries.zh, keys);

    if (typeof val !== 'string') return key;
    return params ? val.replace(/\{(\w+)\}/g, (_, m) => (params[m] !== undefined ? String(params[m]) : `{${m}}`)) : val;
  }
}));

export const t = (key: string, params?: Record<string, string | number>): string =>
  useI18n.getState().t(key, params);
