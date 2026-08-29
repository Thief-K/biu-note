import { describe, it, expect } from 'vitest';
import { formatDate } from '../utils/date.js';
import { isSparkOrTask } from '../utils/note.js';
import { useAuthStore } from '../stores/authStore.js';
import { useNotesStore } from '../stores/notesStore.js';
import { useModalStore } from '../stores/modalStore.js';
import { useThemeStore } from '../stores/themeStore.js';
import { useI18n, t } from '../i18n/index.js';
import zh from '../i18n/locales/zh.js';
import en from '../i18n/locales/en.js';

describe('Frontend Utilities & Zustand Stores (frontend/src/tests/utils.test.js)', () => {
  describe('formatDate', () => {
    it('formats timestamp into YYYY-MM-DD HH:mm format', () => {
      const fixedDate = new Date('2026-08-25T14:30:00Z');
      const result = formatDate(fixedDate);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('returns empty string on null or invalid date', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('invalid-date')).toBe('');
    });
  });

  describe('isSparkOrTask (Frontend invariant parity)', () => {
    it('identifies sparks and tasks correctly', () => {
      expect(isSparkOrTask('sparks/1783587002574.md')).toBe(true);
      expect(isSparkOrTask('tasks/2026-08-25.md')).toBe(true);
      expect(isSparkOrTask('notes/my-note.md')).toBe(false);
      expect(isSparkOrTask('technology/react.md')).toBe(false);
    });
  });

  describe('Zustand notesStore & derived state (notes, sparks, tags)', () => {
    it('single-pass derives notes, sparks, and tags correctly upon setNotes', () => {
      const sampleNotes = [
        { filepath: 'tech/react.md', tags: ['react', 'frontend'] },
        { filepath: 'notes/architecture.md', tags: ['react', 'nodejs'] },
        { filepath: 'sparks/1783587002574.md', content: 'Quick idea' },
        { filepath: 'tasks/2026-08-25.md', content: 'Todo item' }
      ];

      useNotesStore.getState().setNotes(sampleNotes);
      const state = useNotesStore.getState();

      expect(state.allNotes.length).toBe(4);
      expect(state.notes.length).toBe(2);
      expect(state.notes.map(n => n.filepath)).toEqual(['tech/react.md', 'notes/architecture.md']);
      expect(state.sparks.length).toBe(2);
      expect(state.sparks.map(s => s.filepath)).toEqual(['sparks/1783587002574.md', 'tasks/2026-08-25.md']);
      expect(state.tags.sort()).toEqual(['frontend', 'nodejs', 'react']);
    });

    it('correctly updates aiConfigured when hasApiKey is returned by settings API', async () => {
      useAuthStore.getState().setToken('test-token');
      const originalFetch = globalThis.fetch;

      // Case 1: Backend returns hasApiKey: true (with maskedKey)
      globalThis.fetch = async () => ({
        ok: true,
        json: async () => ({
          hasApiKey: true,
          maskedKey: 'sk-o...97c8',
          baseUrl: 'https://openrouter.ai/api/v1'
        })
      });

      await useNotesStore.getState().checkAiConfig();
      expect(useNotesStore.getState().aiConfigured).toBe(true);

      // Case 2: Backend returns hasApiKey: false
      globalThis.fetch = async () => ({
        ok: true,
        json: async () => ({
          hasApiKey: false,
          maskedKey: '',
          baseUrl: ''
        })
      });

      await useNotesStore.getState().checkAiConfig();
      expect(useNotesStore.getState().aiConfigured).toBe(false);

      globalThis.fetch = originalFetch;
    });
  });

  describe('Zustand authStore & modalStore & themeStore', () => {
    it('handles auth token lifecycle', () => {
      useAuthStore.getState().setToken('test-token-123');
      expect(useAuthStore.getState().token).toBe('test-token-123');

      useAuthStore.getState().logout();
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('handles modal state open and close', () => {
      useModalStore.getState().openSparkModal({ filepath: 'sparks/1.md' });
      expect(useModalStore.getState().sparkModal.isOpen).toBe(true);
      expect(useModalStore.getState().sparkModal.spark.filepath).toBe('sparks/1.md');

      useModalStore.getState().closeSparkModal();
      expect(useModalStore.getState().sparkModal.isOpen).toBe(false);

      useModalStore.getState().showConfirm('Delete note?', () => {}, { danger: true });
      expect(useModalStore.getState().confirmDialog.isOpen).toBe(true);
      expect(useModalStore.getState().confirmDialog.confirmVariant).toBe('primary-danger');

      useModalStore.getState().closeConfirm();
      expect(useModalStore.getState().confirmDialog.isOpen).toBe(false);
    });

    it('handles theme state and toggles DOM dark/light classes', () => {
      const classSet = new Set();
      const mockDoc = {
        documentElement: {
          classList: {
            add: (c) => classSet.add(c),
            remove: (c) => classSet.delete(c),
            toggle: (c, val) => (val ? classSet.add(c) : classSet.delete(c)),
            contains: (c) => classSet.has(c)
          },
          style: {}
        }
      };
      const origDoc = globalThis.document;
      globalThis.document = mockDoc;

      useThemeStore.getState().setTheme('light');
      expect(useThemeStore.getState().theme).toBe('light');
      expect(mockDoc.documentElement.classList.contains('light')).toBe(true);
      expect(mockDoc.documentElement.classList.contains('dark')).toBe(false);

      useThemeStore.getState().setTheme('dark');
      expect(useThemeStore.getState().theme).toBe('dark');
      expect(mockDoc.documentElement.classList.contains('dark')).toBe(true);
      expect(mockDoc.documentElement.classList.contains('light')).toBe(false);

      globalThis.document = origDoc;
    });
  });

  describe('i18n system & dictionary integrity', () => {
    it('translates keys in Chinese and English', () => {
      useI18n.getState().setLanguage('zh');
      expect(t('common.save')).toBe('保存');
      expect(t('notes.deleteConfirm', { title: 'MyNote' })).toBe('确定删除笔记 "MyNote"？');

      useI18n.getState().setLanguage('en');
      expect(t('common.save')).toBe('Save');
      expect(t('notes.deleteConfirm', { title: 'MyNote' })).toBe('Delete note "MyNote"?');
      expect(t('notes.importConfirm', { count: 3 })).toBe('Import these 3 Markdown files?');
    });

    it('matches exact dictionary key structure between zh and en', () => {
      const getKeys = (obj, prefix = '') => {
        return Object.keys(obj).flatMap(key => {
          const path = prefix ? `${prefix}.${key}` : key;
          if (obj[key] && typeof obj[key] === 'object') {
            return getKeys(obj[key], path);
          }
          return [path];
        });
      };

      const zhKeys = getKeys(zh).sort();
      const enKeys = getKeys(en).sort();
      expect(zhKeys).toEqual(enKeys);
    });
  });
});
