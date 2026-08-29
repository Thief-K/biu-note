import React from 'react';
import { AlertTriangle, Check, Trash2, X } from 'lucide-react';
import { useModalStore } from '../../stores/modalStore';
import { useI18n } from '../../i18n';
import IconButton from '../common/IconButton';

export default function ConfirmModal() {
  const confirmDialog = useModalStore((s) => s.confirmDialog);
  const closeConfirm = useModalStore((s) => s.closeConfirm);
  const { t } = useI18n();

  if (!confirmDialog.isOpen) return null;

  const ConfirmIcon = confirmDialog.confirmVariant?.includes('danger') 
    ? Trash2 
    : (typeof confirmDialog.confirmIcon === 'function' ? confirmDialog.confirmIcon : Check);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade"
      onClick={closeConfirm}
    >
      <div 
        className="w-full max-w-sm bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden p-5 flex flex-col gap-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-zinc-100">{t('common.tip')}</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {confirmDialog.message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
          <IconButton
            icon={X}
            size="md"
            shape="rounded-xl"
            variant="default"
            onClick={closeConfirm}
          />
          <IconButton
            icon={ConfirmIcon}
            size="md"
            shape="rounded-xl"
            variant={confirmDialog.confirmVariant || 'primary-emerald'}
            onClick={confirmDialog.onConfirm}
          />
        </div>
      </div>
    </div>
  );
}
