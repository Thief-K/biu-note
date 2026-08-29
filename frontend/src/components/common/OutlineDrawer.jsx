import React from 'react';
import { ListTree, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import IconButton from './IconButton';

/**
 * 通用大纲目录抽屉组件
 * 严格展示 H1 ~ H3 级别大纲，具备精美的层级卡片视觉体系
 */
export default function OutlineDrawer({
  isOpen,
  onClose,
  headings = [],
  onSelectHeading
}) {
  const { t } = useI18n();

  if (!isOpen) return null;

  // Filter strictly to levels 1-3 (H1, H2, H3)
  const validHeadings = headings.filter(h => h.level >= 1 && h.level <= 3);

  return (
    <div 
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end animate-fade select-none"
      onClick={onClose}
    >
      <aside 
        className="w-72 md:w-84 h-full bg-zinc-900 border-l border-zinc-800 flex flex-col animate-slide-in pt-safe pb-safe shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header with unified height and baseline alignment */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-800/80 shrink-0 bg-zinc-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <ListTree className="w-4 h-4 text-emerald-400" />
            <span>{t('editor.outline')}</span>
          </div>
          <IconButton
            icon={X}
            variant="ghost"
            size="xs"
            shape="rounded-lg"
            onClick={onClose}
          />
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {validHeadings.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              {t('editor.noHeadings')}
            </div>
          ) : (
            validHeadings.map((h, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (onSelectHeading) onSelectHeading(h);
                }}
                style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                className="w-full text-left py-1.5 pr-2 rounded-lg text-xs text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/60 truncate transition-colors cursor-pointer block"
                title={h.text}
              >
                {h.text}
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
