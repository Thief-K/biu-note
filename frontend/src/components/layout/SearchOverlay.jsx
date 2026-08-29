import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, Lightbulb } from 'lucide-react';
import { useModalStore } from '../../stores/modalStore';
import { useNotesStore } from '../../stores/notesStore';
import { isSparkOrTask } from '../../utils/note';
import { useI18n } from '../../i18n';
import { formatDate } from '../../utils/date';
import { TagList } from '../common/TagBadge';
import EmptyState from '../common/EmptyState';
import IconButton from '../common/IconButton';

export default function SearchOverlay() {
  const isSearchOpen = useModalStore((s) => s.isSearchOpen);
  const setIsSearchOpen = useModalStore((s) => s.setIsSearchOpen);
  const searchQuery = useModalStore((s) => s.searchQuery);
  const setSearchQuery = useModalStore((s) => s.setSearchQuery);
  const allNotes = useNotesStore((s) => s.allNotes);

  const { t } = useI18n();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isSearchOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  // Filter notes
  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allNotes.slice(0, 20);

    if (q.startsWith('#')) {
      const tagQuery = q.slice(1);
      return allNotes.filter(n => 
        Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(tagQuery))
      );
    }

    return allNotes.filter(n => {
      const titleMatch = n.filepath.toLowerCase().includes(q);
      const contentMatch = n.content && n.content.toLowerCase().includes(q);
      const tagMatch = Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(q));
      return titleMatch || contentMatch || tagMatch;
    }).slice(0, 30);
  }, [searchQuery, allNotes]);

  if (!isSearchOpen) return null;

  const handleSelect = (note) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (isSparkOrTask(note.filepath)) {
      navigate('/sparks');
    } else {
      navigate(`/notes/${encodeURIComponent(note.filepath)}`);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] md:pt-[15vh] px-4 bg-black/60 backdrop-blur-sm select-none animate-fade"
      onClick={() => setIsSearchOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden flex flex-col max-h-[70vh] animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950/40">
          <Search className="w-5 h-5 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('notes.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => prev < filteredResults.length - 1 ? prev + 1 : prev);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredResults[selectedIndex]) {
                  handleSelect(filteredResults[selectedIndex]);
                }
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsSearchOpen(false);
              }
            }}
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
          />
          <IconButton
            icon={X}
            size="xs"
            variant="ghost"
            shape="rounded-lg"
            onClick={() => setIsSearchOpen(false)}
          />
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredResults.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon={Search}
                title={t('common.empty')}
              />
            </div>
          ) : (
            filteredResults.map((note, idx) => {
              const isSpark = isSparkOrTask(note.filepath);
              const displayName = note.filepath.replace('.md', '');
              const Icon = isSpark ? Lightbulb : FileText;

              return (
                <div
                  key={note.filepath}
                  onClick={() => handleSelect(note)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    idx === selectedIndex ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 shrink-0">
                      <Icon className={`w-4 h-4 ${isSpark ? 'text-amber-400' : 'text-blue-400'}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-zinc-100 truncate">
                        {isSpark ? (note.content?.slice(0, 40) || displayName) : displayName}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formatDate(note.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Unified Green Pill Tags */}
                  <div className="shrink-0 pl-2">
                    <TagList tags={note.tags} max={3} size="xs" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
