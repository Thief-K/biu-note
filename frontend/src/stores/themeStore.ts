import { create } from 'zustand';

const applyThemeDOM = (themeValue: string): void => {
  if (typeof document === 'undefined') return;
  const isDark =
    themeValue === 'dark' ||
    (themeValue === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
};

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
  initTheme: () => (() => void) | undefined;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: typeof localStorage !== 'undefined' ? localStorage.getItem('biunote-theme') || 'dark' : 'dark',
  setTheme: (theme: string) => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('biunote-theme', theme);
      } catch (e) {
        console.warn('Failed to save theme to localStorage:', e);
      }
    }
    applyThemeDOM(theme);
    set({ theme });
  },
  initTheme: () => {
    const theme = get().theme;
    applyThemeDOM(theme);

    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemChange = () => {
        if (get().theme === 'system') {
          applyThemeDOM('system');
        }
      };
      media.addEventListener('change', handleSystemChange);
      return () => media.removeEventListener('change', handleSystemChange);
    }
  }
}));

// Synchronously initialize theme on module load if in browser
if (typeof window !== 'undefined') {
  useThemeStore.getState().initTheme();
}
