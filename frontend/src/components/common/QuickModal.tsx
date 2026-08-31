import type { ComponentType, FormEventHandler, ReactNode } from 'react';
import { X, Check } from 'lucide-react';
import AlertBanner from './AlertBanner';
import IconButton from './IconButton';

export interface QuickModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  icon?: ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  loading?: boolean;
  error?: string;
  charCount?: number;
  canSubmit?: boolean;
  confirmIcon?: ComponentType<{ size?: number | string; className?: string }>;
  accentColor?: 'amber' | 'emerald' | string;
  leftAction?: ReactNode;
  children?: ReactNode;
}

/**
 * 通用微型快捷速记/灵感弹窗容器组件
 */
export default function QuickModal({
  isOpen = true,
  onClose,
  onSubmit,
  icon: Icon,
  title,
  loading = false,
  error = '',
  charCount = 0,
  canSubmit = true,
  confirmIcon: ConfirmIcon = Check,
  accentColor = 'amber',
  leftAction,
  children
}: QuickModalProps) {
  if (!isOpen) return null;

  const accentStyles: Record<string, { cardBorder: string; iconBox: string }> = {
    amber: {
      cardBorder: 'border-amber-500/40',
      iconBox: 'bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400'
    },
    emerald: {
      cardBorder: 'border-emerald-500/40',
      iconBox: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400'
    }
  };

  const currentAccentStyle = accentStyles[accentColor] || accentStyles.emerald;
  const isBtnActive = canSubmit && !loading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 md:pt-24 bg-black/75 backdrop-blur-sm overflow-y-auto select-none animate-fade"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md bg-zinc-900 border ${currentAccentStyle.cardBorder} rounded-2xl overflow-hidden p-4 flex flex-col gap-3 animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with shortcut hint */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${currentAccentStyle.iconBox}`}>
                <Icon size={16} className="w-3.5 h-3.5" />
              </div>
            )}
            <h3 className="text-xs font-semibold text-zinc-100">{title}</h3>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 text-[9px]">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 text-[9px]">↵</kbd>
          </div>
        </div>

        {error && <AlertBanner variant="error" message={error} />}

        {/* Modal Form Body */}
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {children}

          {/* Action Footer with rounded-full micro-capsule buttons */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2">
              {leftAction}
              {charCount > 0 && (
                <span className="text-[11px] text-zinc-500 font-mono">
                  {`${charCount} 字`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Cancel Button */}
              <IconButton
                icon={X}
                size="md"
                shape="rounded-full"
                variant="default"
                onClick={onClose}
              />

              {/* Submit Button */}
              <IconButton
                icon={ConfirmIcon}
                type="submit"
                loading={loading}
                disabled={!isBtnActive}
                size="md"
                shape="rounded-full"
                variant={isBtnActive ? (accentColor === 'amber' ? 'primary-amber' : 'primary-emerald') : 'default'}
                className={!isBtnActive ? 'opacity-40' : ''}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
