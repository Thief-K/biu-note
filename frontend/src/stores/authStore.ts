import { create } from 'zustand';

interface AuthState {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('biunote_token') : null,
  setToken: (token: string | null) => {
    if (typeof localStorage !== 'undefined') {
      token ? localStorage.setItem('biunote_token', token) : localStorage.removeItem('biunote_token');
    }
    set({ token });
  },
  logout: () => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem('biunote_token');
    set({ token: null });
  }
}));
