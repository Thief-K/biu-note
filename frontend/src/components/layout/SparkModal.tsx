import { useState, useEffect, type FormEvent } from 'react';
import { Lightbulb } from 'lucide-react';
import { useModalStore } from '../../stores/modalStore';
import { useNotesStore } from '../../stores/notesStore';
import { apiFetch } from '../../utils/api';
import { useI18n } from '../../i18n';
import QuickModal from '../common/QuickModal';

export default function SparkModal() {
  const sparkModal = useModalStore((s) => s.sparkModal);
  const closeSparkModal = useModalStore((s) => s.closeSparkModal);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const { t } = useI18n();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!sparkModal.spark;

  useEffect(() => {
    if (sparkModal.isOpen) {
      setContent(sparkModal.spark ? sparkModal.spark.content || '' : '');
      setError('');
    }
  }, [sparkModal]);

  if (!sparkModal.isOpen) return null;

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      if (isEditing && sparkModal.spark) {
        // Update existing spark via PUT /api/sparks
        const res = await apiFetch('/api/sparks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filepath: sparkModal.spark.filepath,
            content: content.trim()
          })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || t('common.saveFailed'));
        }
      } else {
        // Create new spark
        const res = await apiFetch('/api/sparks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim() })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || t('common.saveFailed'));
        }
      }

      await fetchNotes();
      closeSparkModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <QuickModal
      isOpen={sparkModal.isOpen}
      onClose={closeSparkModal}
      onSubmit={handleSubmit}
      icon={Lightbulb}
      title={isEditing ? t('sparks.editTitle') : t('sparks.newTitle')}
      loading={loading}
      error={error}
      charCount={content.length}
      canSubmit={!!content.trim()}
      accentColor="amber"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('sparks.inputPlaceholder')}
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
    </QuickModal>
  );
}
