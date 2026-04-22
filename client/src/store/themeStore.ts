import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const getSaved = (): Theme => {
  const saved = localStorage.getItem('fintrack_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const apply = (t: Theme) => {
  document.documentElement.dataset.theme = t;
  localStorage.setItem('fintrack_theme', t);
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getSaved(),
  toggle: () =>
    set((s) => {
      const next: Theme = s.theme === 'dark' ? 'light' : 'dark';
      apply(next);
      return { theme: next };
    }),
  setTheme: (t) => {
    apply(t);
    set({ theme: t });
  },
}));
