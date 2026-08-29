import { create } from 'zustand';

const DEFAULT_CONFIRM_STATE = {
  isOpen: false,
  message: '',
  onConfirm: null,
  confirmIcon: null,
  confirmVariant: 'primary-emerald'
};

export const useModalStore = create((set) => ({
  // 1. Confirm Dialog
  confirmDialog: DEFAULT_CONFIRM_STATE,
  showConfirm: (message, onConfirm, options = {}) => {
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
  openDiff: (diffData) => set({ isDiffOpen: true, diffData }),
  closeDiff: () => set({ isDiffOpen: false, diffData: null }),

  // 3. Global Search Overlay
  isSearchOpen: false,
  searchQuery: '',
  setIsSearchOpen: (isSearchOpen) => set((state) => ({
    isSearchOpen: typeof isSearchOpen === 'function' ? isSearchOpen(state.isSearchOpen) : isSearchOpen
  })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  // 4. Spark Modal
  sparkModal: { isOpen: false, spark: null },
  openSparkModal: (spark = null) => set({ sparkModal: { isOpen: true, spark } }),
  closeSparkModal: () => set({ sparkModal: { isOpen: false, spark: null } }),

  // 5. AI Memo Modal
  isAiMemoOpen: false,
  openAiMemo: () => set({ isAiMemoOpen: true }),
  closeAiMemo: () => set({ isAiMemoOpen: false })
}));
