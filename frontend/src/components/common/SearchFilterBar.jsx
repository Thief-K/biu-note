import React from 'react';
import { Search, Tag, X } from 'lucide-react';
import { useI18n } from '../../i18n';

/**
 * 通用搜索与标签筛选栏组件
 */
export default function SearchFilterBar({
  searchQuery,
  onSearchChange,
  selectedTag = '',
  onTagSelect,
  tags = [],
  placeholder = '搜索内容...',
  accentColor = 'amber' // 'amber' | 'blue' | 'emerald'
}) {
  const { t } = useI18n();
  const focusBorderClass = {
    amber: 'focus:border-amber-500/50',
    blue: 'focus:border-blue-500/50',
    emerald: 'focus:border-emerald-500/50'
  }[accentColor] || 'focus:border-emerald-500/50';

  const tagActiveBadgeClass = {
    amber: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
    blue: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40',
    emerald: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
  }[accentColor] || 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40';

  return (
    <div className="pt-2 flex flex-col gap-2.5 border-t border-zinc-850/60 animate-slide-down">
      {/* Search Input Bar */}
      <div className="relative flex items-center w-full h-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className={`w-full h-8 bg-zinc-900 border border-zinc-800 rounded-xl px-3 pl-8 pr-8 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none ${focusBorderClass} font-sans leading-none`}
        />
        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tag Filter Pills */}
      {tags.length > 0 && onTagSelect && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar select-none">
          <button
            type="button"
            onClick={() => onTagSelect('')}
            className={`h-5 px-2 rounded-full text-[11px] font-medium shrink-0 transition-colors cursor-pointer border flex items-center justify-center leading-none ${
              !selectedTag
                ? tagActiveBadgeClass
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border-zinc-800'
            }`}
          >
            {t('common.all')}
          </button>
          {tags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagSelect(isSelected ? '' : tag)}
                className={`h-5 px-2 rounded-full text-[11px] font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1 border justify-center leading-none ${
                  isSelected
                    ? tagActiveBadgeClass
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                }`}
              >
                <Tag className="w-2.5 h-2.5 shrink-0 stroke-[2.2]" />
                <span className="leading-none">{tag}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
