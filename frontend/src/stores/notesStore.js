import { create } from 'zustand';
import { apiFetch } from '../utils/api';
import { isSparkOrTask } from '../utils/note';
import { useAuthStore } from './authStore';

const deriveNoteData = (rawNotes = []) => {
  const sparks = [];
  const notes = [];

  for (const n of rawNotes) {
    if (isSparkOrTask(n.filepath)) sparks.push(n);
    else notes.push(n);
  }

  return {
    allNotes: rawNotes,
    notes,
    sparks,
    tags: [...new Set(rawNotes.flatMap((n) => n.tags || []))]
  };
};

export const useNotesStore = create((set) => ({
  allNotes: [],
  notes: [],
  sparks: [],
  tags: [],
  isLoadingNotes: true,
  aiConfigured: true,

  setNotes: (rawNotes) => {
    set(deriveNoteData(rawNotes));
  },

  fetchNotes: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ isLoadingNotes: false });
      return;
    }

    set({ isLoadingNotes: true });
    try {
      const res = await apiFetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        set({
          ...deriveNoteData(data),
          isLoadingNotes: false
        });
      } else {
        set({ isLoadingNotes: false });
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      set({ isLoadingNotes: false });
    }
  },

  checkAiConfig: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const res = await apiFetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        set({ aiConfigured: Boolean(data.hasApiKey || (data.apiKey && data.apiKey.trim())) });
      }
    } catch (err) {
      console.error('Failed to check AI config:', err);
    }
  }
}));
