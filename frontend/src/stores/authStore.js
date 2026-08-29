import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('biunote_token') : null,
  setToken: (token) => {
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

