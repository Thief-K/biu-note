import { create } from 'zustand';
import { apiFetch } from '../utils/api';
import { isSparkOrTask } from '../utils/note';
import { useAuthStore } from './authStore';
import type { NoteItem, SparkItem } from '../types';

interface DerivedNoteData {
  allNotes: NoteItem[];
  notes: NoteItem[];
  sparks: SparkItem[];
  tags: string[];
}

const deriveNoteData = (rawNotes: NoteItem[] = []): DerivedNoteData => {
  const sparks: SparkItem[] = [];
  const notes: NoteItem[] = [];

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

interface NotesState extends DerivedNoteData {
  isLoadingNotes: boolean;
  aiConfigured: boolean;
  setNotes: (rawNotes: NoteItem[]) => void;
  fetchNotes: () => Promise<void>;
  checkAiConfig: () => Promise<void>;
}

export const useNotesStore = create<NotesState>((set) => ({
  allNotes: [],
  notes: [],
  sparks: [],
  tags: [],
  isLoadingNotes: true,
  aiConfigured: true,

  setNotes: (rawNotes: NoteItem[]) => {
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
        const data = (await res.json()) as NoteItem[];
        set({
          ...deriveNoteData(data),
          isLoadingNotes: false
        });
      } else {
        set({ isLoadingNotes: false });
      }
    } catch (err: unknown) {
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
        const data = (await res.json()) as { hasApiKey?: boolean; apiKey?: string };
        set({ aiConfigured: Boolean(data.hasApiKey || (data.apiKey && data.apiKey.trim())) });
      }
    } catch (err: unknown) {
      console.error('Failed to check AI config:', err);
    }
  }
}));
