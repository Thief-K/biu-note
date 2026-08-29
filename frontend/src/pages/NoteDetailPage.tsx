import { useMemo, useSyncExternalStore } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNotesStore } from '../stores/notesStore';
import { useI18n } from '../i18n';
import NoteReader from '../components/reader/NoteReader';
import LiveMarkdownEditor from '../components/editor/LiveMarkdownEditor';
import IconButton from '../components/common/IconButton';

export default function NoteDetailPage() {
  const { filepath: rawFilepath } = useParams<{ filepath: string }>();
  const filepath = rawFilepath ? decodeURIComponent(rawFilepath) : '';
  const isNew = filepath === 'new';

  const allNotes = useNotesStore((s) => s.allNotes);
  const isLoadingNotes = useNotesStore((s) => s.isLoadingNotes);
  const { t } = useI18n();
  const navigate = useNavigate();

  // Native matchMedia subscription (Mobile < 768px vs Desktop >= 768px)
  const isMobile = useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia('(max-width: 767px)');
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(max-width: 767px)').matches
  );

  // Find note by filepath
  const currentNote = useMemo(() => {
    if (isNew) return null;
    return allNotes.find((n) => n.filepath === filepath);
  }, [allNotes, filepath, isNew]);

  // Mobile does not support creating new notes - redirect to notes list
  if (isMobile && isNew) {
    return <Navigate to="/notes" replace />;
  }

  if (!isNew && !currentNote) {
    if (isLoadingNotes) {
      return (
        <div className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      );
    }
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-3">
        <p className="text-sm">{t('notes.notFound')}</p>
        <IconButton
          icon={ArrowLeft}
          size="md"
          variant="default"
          shape="rounded-xl"
          onClick={() => navigate('/notes')}
        />
      </div>
    );
  }

  // Mobile: Read-only preview with AI modification tools
  if (isMobile) {
    return <NoteReader note={currentNote} />;
  }

  // Desktop: Direct immersive live Markdown editor with auto-save
  return (
    <LiveMarkdownEditor
      key={filepath}
      filepath={filepath}
      initialNote={currentNote}
    />
  );
}
