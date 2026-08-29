import { create } from 'zustand';
import zh from './locales/zh';
import en from './locales/en';

const dictionaries = { zh, en };

const getInitialLanguage = () => {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('biunote-language') : null;
  if (saved === 'zh' || saved === 'en') return saved;
  return typeof navigator !== 'undefined' && navigator.language?.startsWith('en') ? 'en' : 'zh';
};

export const useI18n = create((set, get) => ({
  language: getInitialLanguage(),
  setLanguage: (lang) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('biunote-language', lang);
    }
    set({ language: lang });
  },
  t: (key, params) => {
    const lang = get().language;
    const keys = key.split('.');
    const val = keys.reduce((acc, k) => acc?.[k], dictionaries[lang]) 
      ?? keys.reduce((acc, k) => acc?.[k], dictionaries.zh);

    if (typeof val !== 'string') return key;
    return params ? val.replace(/\{(\w+)\}/g, (_, m) => params[m] ?? `{${m}}`) : val;
  }
}));

export const t = (key, params) => useI18n.getState().t(key, params);
