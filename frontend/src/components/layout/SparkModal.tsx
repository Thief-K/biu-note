import { useState, useEffect, type FormEvent } from 'react';
import { Lightbulb, Mic, MicOff } from 'lucide-react';
import { useModalStore } from '../../stores/modalStore';
import { useNotesStore } from '../../stores/notesStore';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { apiFetch } from '../../utils/api';
import { useI18n } from '../../i18n';
import QuickModal from '../common/QuickModal';
import IconButton from '../common/IconButton';

export default function SparkModal() {
  const sparkModal = useModalStore((s) => s.sparkModal);
  const closeSparkModal = useModalStore((s) => s.closeSparkModal);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const { t } = useI18n();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!sparkModal.spark;

  const { isListening, isSupported, toggle: toggleSpeech, stop: stopSpeech } = useSpeechRecognition({
    onTranscript: (transcript, isFinal) => {
      if (isFinal) {
        setContent((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
        });
      }
    },
    onError: (errKey) => {
      setError(t(errKey));
    }
  });

  useEffect(() => {
    if (sparkModal.isOpen) {
      setContent(sparkModal.spark ? sparkModal.spark.content || '' : '');
      setError('');
    } else {
      stopSpeech();
    }
  }, [sparkModal, stopSpeech]);

  if (!sparkModal.isOpen) return null;

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || loading) return;

    stopSpeech();
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

  const handleClose = () => {
    stopSpeech();
    closeSparkModal();
  };

  const voiceButton = isSupported ? (
    <IconButton
      icon={isListening ? MicOff : Mic}
      size="md"
      shape="rounded-full"
      variant={isListening ? 'primary-amber' : 'amber'}
      onClick={toggleSpeech}
      className={isListening ? 'animate-pulse ring-2 ring-amber-500/50' : ''}
      title={isListening ? t('sparks.stopVoiceInput') : t('sparks.voiceInput')}
    />
  ) : null;

  return (
    <QuickModal
      isOpen={sparkModal.isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      icon={Lightbulb}
      title={isEditing ? t('sparks.editTitle') : t('sparks.newTitle')}
      loading={loading}
      error={error}
      charCount={content.length}
      canSubmit={!!content.trim()}
      accentColor="amber"
      leftAction={voiceButton}
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isListening ? t('sparks.listening') : t('sparks.inputPlaceholder')}
        autoFocus
        rows={4}
        className={`w-full bg-zinc-950/60 border rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed select-text transition-all ${
          isListening
            ? 'border-amber-500/60 ring-1 ring-amber-500/30'
            : 'border-zinc-800/70 focus:border-zinc-700'
        }`}
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
