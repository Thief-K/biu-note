import { useState, useMemo, type DragEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Trash2, Clock } from 'lucide-react';
import { useNotesStore } from '../stores/notesStore';
import { useModalStore } from '../stores/modalStore';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';
import { formatDate } from '../utils/date';
import PageHeader from '../components/common/PageHeader';
import SearchFilterBar from '../components/common/SearchFilterBar';
import EmptyState from '../components/common/EmptyState';
import { TagList } from '../components/common/TagBadge';
import IconButton from '../components/common/IconButton';
import PullToRefresh from '../components/common/PullToRefresh';
import type { NoteItem } from '../types';

export default function NotesPage() {
  const notes = useNotesStore((s) => s.notes);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const showConfirm = useModalStore((s) => s.showConfirm);
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const navigate = useNavigate();

  // Filtered Notes
  const filteredNotes = useMemo<NoteItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;

    // #tag filtering: Matches note tags specifically
    if (q.startsWith('#')) {
      const tagQuery = q.slice(1).trim();
      if (!tagQuery) {
        return notes.filter((n) => Array.isArray(n.tags) && n.tags.length > 0);
      }
      return notes.filter(
        (n) => Array.isArray(n.tags) && n.tags.some((tag) => tag.toLowerCase().includes(tagQuery))
      );
    }

    // Keyword filtering: Matches note title and content
    return notes.filter((n) => {
      const titleMatch = n.filepath.toLowerCase().includes(q);
      const contentMatch = n.content && n.content.toLowerCase().includes(q);
      return titleMatch || contentMatch;
    });
  }, [notes, searchQuery]);

  // Handle Delete Note
  const handleDeleteNote = (e: MouseEvent, note: NoteItem) => {
    e.stopPropagation();
    const title = note.filepath.replace('.md', '');
    showConfirm(t('notes.deleteConfirm', { title }), async () => {
      try {
        const res = await apiFetch('/api/notes/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filepath: note.filepath })
        });
        if (res.ok) {
          await fetchNotes();
        }
      } catch (err: unknown) {
        console.error('Failed to delete note:', err);
      }
    });
  };

  // Handle Drop .md files to import
  const handleDropFiles = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.md'));
    if (files.length === 0) return;

    showConfirm(t('notes.importConfirm', { count: files.length }), async () => {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          await apiFetch('/api/notes/import', {
            method: 'POST',
            body: formData
          });
        } catch (err: unknown) {
          console.error('Failed to import note:', err);
        }
      }
      await fetchNotes();
    });
  };

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 text-zinc-100"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropFiles}
    >
      {/* 1. Header with Search Bar (Clean without tag index) */}
      <PageHeader
        icon={FileText}
        iconClassName="bg-blue-500/10 border-blue-500/20 text-blue-400"
        title={t('notes.title')}
        count={filteredNotes.length}
        countClassName="bg-blue-500/10 text-blue-400 border-blue-500/20"
        actions={
          <>
            <IconButton
              icon={Search}
              size="md"
              variant={isSearchVisible || searchQuery ? 'blue' : 'default'}
              onClick={() => {
                setIsSearchVisible((prev) => !prev);
                if (isSearchVisible) {
                  setSearchQuery('');
                }
              }}
            />

            <div className="hidden md:block">
              <IconButton
                icon={Plus}
                size="md"
                variant="primary-blue"
                onClick={() => navigate('/notes/new')}
              />
            </div>
          </>
        }
      >
        {(isSearchVisible || searchQuery) && (
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder={t('notes.searchPlaceholder')}
            accentColor="blue"
          />
        )}
      </PageHeader>

      {/* 2. Scrollable Notes Cards List with Pull-to-Refresh */}
      <PullToRefresh
        onRefresh={fetchNotes}
        accentColor="blue"
        className="flex-1 px-4 md:px-8 py-4 pb-32"
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {filteredNotes.length === 0 ? (
            <EmptyState icon={FileText} title={t('notes.empty')} />
          ) : (
            filteredNotes.map((note) => {
              const title = note.filepath.replace('.md', '');

              return (
                <div
                  key={note.filepath}
                  onClick={() => navigate(`/notes/${encodeURIComponent(note.filepath)}`)}
                  className="px-4 py-3 rounded-2xl bg-zinc-900 border border-blue-500/35 hover:border-blue-500/70 flex flex-col gap-2 transition-all cursor-pointer group"
                >
                  {/* Title */}
                  <div className="flex items-center justify-between min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors truncate">
                      {title}
                    </h3>
                  </div>

                  {/* Tag List */}
                  <TagList tags={note.tags} />

                  {/* Metadata footer with delete button on right bottom */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-850/50 text-[11px] text-zinc-500 select-none">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{formatDate(note.updated_at)}</span>
                    </span>

                    <div className="flex items-center gap-1.5 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconButton
                        icon={Trash2}
                        size="xs"
                        variant="danger"
                        shape="rounded-lg"
                        onClick={(e) => handleDeleteNote(e, note)}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
