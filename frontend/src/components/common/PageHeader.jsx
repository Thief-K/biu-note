import React from 'react';
import { ArrowLeft } from 'lucide-react';
import IconButton from './IconButton';

/**
 * 通用页面顶部导航通栏组件
 */
export default function PageHeader({
  onBack,
  icon: Icon,
  iconClassName = 'bg-zinc-800/80 border-zinc-700/80 text-zinc-300',
  title,
  count,
  countClassName = 'bg-zinc-800/80 text-zinc-400 border-zinc-700/80',
  actions,
  children
}) {
  return (
    <div className="px-4 md:px-8 py-3.5 border-b border-zinc-850/80 shrink-0 select-none bg-zinc-950/60 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        <div className="flex items-center justify-between h-8">
          {/* Left: Optional Back Button + Badge Icon + Title + Optional Count */}
          <div className="flex items-center gap-2.5 h-8">
            {onBack && (
              <IconButton
                icon={ArrowLeft}
                size="md"
                className="-ml-1"
                onClick={onBack}
              />
            )}
            {Icon && (
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${iconClassName}`}>
                <Icon className="w-4 h-4" />
              </div>
            )}
            <h2 className="text-base font-bold text-zinc-100 leading-none">{title}</h2>
            {count !== undefined && count !== null && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-medium border leading-none ${countClassName}`}>
                {count}
              </span>
            )}
          </div>

          {/* Right: Actions */}
          {actions && (
            <div className="flex items-center gap-2 h-8">
              {actions}
            </div>
          )}
        </div>

        {/* Optional Collapsible Dropdown or Filter Bar */}
        {children}
      </div>
    </div>
  );
}
