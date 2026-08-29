import { useState, type FormEvent } from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { useModalStore } from '../../stores/modalStore';
import { useNotesStore } from '../../stores/notesStore';
import { apiFetch } from '../../utils/api';
import { useI18n } from '../../i18n';
import QuickModal from '../common/QuickModal';

export default function AiMemoModal() {
  const isAiMemoOpen = useModalStore((s) => s.isAiMemoOpen);
  const closeAiMemo = useModalStore((s) => s.closeAiMemo);
  const openDiff = useModalStore((s) => s.openDiff);
  const aiConfigured = useNotesStore((s) => s.aiConfigured);
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAiMemoOpen) return null;

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || loading) return;

    if (!aiConfigured) {
      setError(t('chat.noConfig'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), memo: memo.trim() })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('chat.error'));
      }

      const data = await res.json();
      setText('');
      setMemo('');
      closeAiMemo();
      openDiff(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <QuickModal
      isOpen={isAiMemoOpen}
      onClose={closeAiMemo}
      onSubmit={handleSubmit}
      icon={Zap}
      title={t('common.aiMemo')}
      loading={loading}
      error={error}
      charCount={text.length}
      canSubmit={!!text.trim()}
      confirmIcon={Sparkles}
      accentColor="emerald"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('common.inputOrPaste')}
        autoFocus
        rows={4}
        className="w-full bg-zinc-950/60 border border-zinc-800/70 focus:border-zinc-700 rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed select-text transition-colors"
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />

      <input
        type="text"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder={t('common.optionalInstruction')}
        className="w-full bg-zinc-950/60 border border-zinc-800/70 focus:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none select-text transition-colors"
      />
    </QuickModal>
  );
}
