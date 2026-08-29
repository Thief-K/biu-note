import { useState, type MouseEventHandler } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import { useI18n } from '../../i18n';

export interface TagBadgeProps {
  tag: string;
  onRemove?: (tag: string) => void;
  onClick?: MouseEventHandler<HTMLSpanElement>;
  className?: string;
  size?: 'sm' | 'xs';
}

/**
 * 通用标签徽章组件
 */
export default function TagBadge({
  tag,
  onRemove,
  onClick,
  className = '',
  size = 'sm'
}: TagBadgeProps) {
  const sizeClasses = size === 'xs' ? 'h-4.5 px-1.5 text-[10px] gap-1' : 'h-5 px-2 text-[11px] gap-1';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full bg-emerald-500/10 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-medium shrink-0 leading-none select-none ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/20' : ''
      } ${className}`}
    >
      <Tag className="w-2.5 h-2.5 shrink-0 stroke-[2.2]" />
      <span className="leading-none">{tag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer ml-0.5 leading-none flex items-center justify-center"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

export interface TagListProps {
  tags?: string[];
  max?: number;
  onTagClick?: (tag: string) => void;
  onTagRemove?: (tag: string) => void;
  onTagAdd?: (tag: string) => void;
  size?: 'sm' | 'xs';
  className?: string;
}

/**
 * 通用标签流列表组件
 */
export function TagList({
  tags = [],
  max,
  onTagClick,
  onTagRemove,
  onTagAdd,
  size = 'sm',
  className = ''
}: TagListProps) {
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim().replace(/^#/, '');
    if (trimmed && onTagAdd) {
      onTagAdd(trimmed);
    }
    setInputValue('');
    setIsAdding(false);
  };

  const hasTags = Array.isArray(tags) && tags.length > 0;
  if (!hasTags && !onTagAdd) return null;

  const displayTags = max ? tags.slice(0, max) : tags;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {displayTags.map((t, idx) => (
        <TagBadge
          key={t || idx}
          tag={t}
          size={size}
          onClick={onTagClick ? () => onTagClick(t) : undefined}
          onRemove={onTagRemove ? () => onTagRemove(t) : undefined}
        />
      ))}
      {max && tags.length > max && (
        <span className="text-[10px] text-zinc-500 font-mono">
          +{tags.length - max}
        </span>
      )}
      {onTagAdd && (
        isAdding ? (
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                } else if (e.key === 'Escape') {
                  setIsAdding(false);
                }
              }}
              onBlur={handleAdd}
              placeholder={t('common.addTag')}
              autoFocus
              className="bg-zinc-900 border border-emerald-500/50 rounded-full px-2.5 py-0.5 text-xs text-emerald-400 placeholder-zinc-500 focus:outline-none w-20"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="h-5 px-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 text-[11px] leading-none flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95 shrink-0"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>{t('common.addTag')}</span>
          </button>
        )
      )}
    </div>
  );
}
