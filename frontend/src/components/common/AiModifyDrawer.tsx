import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, X, Sparkles, Settings } from 'lucide-react';
import { useNotesStore } from '../../stores/notesStore';
import { useI18n } from '../../i18n';
import AlertBanner from './AlertBanner';
import IconButton from './IconButton';

export interface AiModifyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onModify: (memo: string) => void;
  loading?: boolean;
  error?: string;
  isDraftMode?: boolean;
}

/**
 * 通用 AI 协同修改 / 起草抽屉组件
 */
export default function AiModifyDrawer({
  isOpen,
  onClose,
  onModify,
  loading = false,
  error = '',
  isDraftMode = false
}: AiModifyDrawerProps) {
  const aiConfigured = useNotesStore((s) => s.aiConfigured);
  const { t } = useI18n();
  const navigate = useNavigate();
  const [memo, setMemo] = useState('');

  if (!isOpen) return null;

  const chips = isDraftMode
    ? [
        t('editor.presetOutline'),
        t('editor.presetDraft'),
        t('editor.presetMeetingNotes'),
        t('editor.presetInspire')
      ]
    : [
        t('editor.presetPolish'),
        t('editor.presetProofread'),
        t('editor.presetSummarize'),
        t('editor.presetExpand')
      ];

  const handleSubmit = (overrideMemo?: string) => {
    const textToSend = overrideMemo || memo;
    if (!textToSend.trim()) return;
    onModify(textToSend.trim());
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end animate-fade select-none"
      onClick={onClose}
    >
      <aside
        className="w-80 md:w-96 h-full bg-zinc-900 border-l border-zinc-800 flex flex-col animate-slide-in pt-safe pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header with unified height and baseline alignment */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-800/80 shrink-0 bg-zinc-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Wand2 className="w-4 h-4 text-emerald-400" />
            <span>{isDraftMode ? t('editor.aiDraft') : t('editor.aiModify')}</span>
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
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Unconfigured API Notice Banner */}
          {!aiConfigured && (
            <AlertBanner
              variant="warning"
              message={t('chat.noConfig')}
              action={
                <IconButton
                  icon={Settings}
                  variant="amber"
                  size="xs"
                  shape="rounded-lg"
                  onClick={() => navigate('/settings')}
                />
              }
            />
          )}

          {error && <AlertBanner variant="error" message={error} />}

          {/* Quick Preset Chips */}
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSubmit(chip)}
                disabled={loading || !aiConfigured}
                className="px-2.5 py-1 rounded-full bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-xs text-zinc-300 hover:text-emerald-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Custom Instruction Input */}
          <div className="flex flex-col gap-2">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              disabled={loading || !aiConfigured}
              placeholder={
                aiConfigured
                  ? isDraftMode
                    ? t('editor.aiDraftPlaceholder')
                    : t('editor.aiPromptPlaceholder')
                  : t('chat.noConfig')
              }
              rows={3}
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 resize-none select-text disabled:opacity-40 disabled:cursor-not-allowed"
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="flex justify-end">
              <IconButton
                type="button"
                icon={Sparkles}
                loading={loading}
                disabled={loading || !memo.trim() || !aiConfigured}
                size="md"
                shape="rounded-xl"
                variant={memo.trim() && !loading && aiConfigured ? 'primary' : 'default'}
                className={!memo.trim() || loading || !aiConfigured ? 'opacity-40 cursor-not-allowed' : ''}
                onClick={() => handleSubmit()}
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
