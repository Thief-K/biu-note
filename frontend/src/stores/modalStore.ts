import { create } from 'zustand';
import type { ConfirmDialogState, ConfirmOptions, DiffData, SparkItem, SparkModalState } from '../types';

const DEFAULT_CONFIRM_STATE: ConfirmDialogState = {
  isOpen: false,
  message: '',
  onConfirm: null,
  confirmIcon: null,
  confirmVariant: 'primary-emerald'
};

interface ModalState {
  // 1. Confirm Dialog
  confirmDialog: ConfirmDialogState;
  showConfirm: (message: string, onConfirm?: () => void, options?: ConfirmOptions) => void;
  closeConfirm: () => void;

  // 2. Diff Modal
  isDiffOpen: boolean;
  diffData: DiffData | null;
  openDiff: (diffData: DiffData) => void;
  closeDiff: () => void;

  // 3. Global Search Overlay
  isSearchOpen: boolean;
  searchQuery: string;
  setIsSearchOpen: (isSearchOpen: boolean | ((prev: boolean) => boolean)) => void;
  setSearchQuery: (searchQuery: string) => void;

  // 4. Spark Modal
  sparkModal: SparkModalState;
  openSparkModal: (spark?: SparkItem | null) => void;
  closeSparkModal: () => void;

  // 5. AI Memo Modal
  isAiMemoOpen: boolean;
  openAiMemo: () => void;
  closeAiMemo: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  // 1. Confirm Dialog
  confirmDialog: DEFAULT_CONFIRM_STATE,
  showConfirm: (message: string, onConfirm?: () => void, options: ConfirmOptions = {}) => {
    const isDanger = options.danger ?? (typeof message === 'string' && /删除|清空|delete|clear/i.test(message));
    set({
      confirmDialog: {
        isOpen: true,
        message,
        confirmIcon: options.icon || (isDanger ? 'trash' : 'check'),
        confirmVariant: options.variant || (isDanger ? 'primary-danger' : 'primary-emerald'),
        onConfirm: () => {
          if (onConfirm) onConfirm();
          set({ confirmDialog: DEFAULT_CONFIRM_STATE });
        }
      }
    });
  },
  closeConfirm: () => set({ confirmDialog: DEFAULT_CONFIRM_STATE }),

  // 2. Diff Modal
  isDiffOpen: false,
  diffData: null,
  openDiff: (diffData: DiffData) => set({ isDiffOpen: true, diffData }),
  closeDiff: () => set({ isDiffOpen: false, diffData: null }),

  // 3. Global Search Overlay
  isSearchOpen: false,
  searchQuery: '',
  setIsSearchOpen: (isSearchOpen: boolean | ((prev: boolean) => boolean)) =>
    set((state) => ({
      isSearchOpen: typeof isSearchOpen === 'function' ? isSearchOpen(state.isSearchOpen) : isSearchOpen
    })),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),

  // 4. Spark Modal
  sparkModal: { isOpen: false, spark: null },
  openSparkModal: (spark: SparkItem | null = null) => set({ sparkModal: { isOpen: true, spark } }),
  closeSparkModal: () => set({ sparkModal: { isOpen: false, spark: null } }),

  // 5. AI Memo Modal
  isAiMemoOpen: false,
  openAiMemo: () => set({ isAiMemoOpen: true }),
  closeAiMemo: () => set({ isAiMemoOpen: false })
}));
