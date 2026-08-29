import { useState, useMemo } from 'react';
import { Lightbulb, Search, Trash2, Edit3, Clock, Plus } from 'lucide-react';
import { useNotesStore } from '../stores/notesStore';
import { useModalStore } from '../stores/modalStore';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';
import { formatDate } from '../utils/date';
import PageHeader from '../components/common/PageHeader';
import SearchFilterBar from '../components/common/SearchFilterBar';
import EmptyState from '../components/common/EmptyState';
import IconButton from '../components/common/IconButton';
import { TagList } from '../components/common/TagBadge';
import type { SparkItem } from '../types';

export default function SparksPage() {
  const sparks = useNotesStore((s) => s.sparks);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const showConfirm = useModalStore((s) => s.showConfirm);
  const openSparkModal = useModalStore((s) => s.openSparkModal);
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Collect all unique tags in sparks
  const sparkTags = useMemo(() => Array.from(new Set(sparks.flatMap((s) => s.tags || []))), [sparks]);

  // Filtered sparks
  const filteredSparks = useMemo(() => {
    return sparks.filter((s) => {
      const matchSearch =
        !searchQuery.trim() ||
        (s.content && s.content.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchTag = !selectedTag || (Array.isArray(s.tags) && s.tags.includes(selectedTag));
      return matchSearch && matchTag;
    });
  }, [sparks, searchQuery, selectedTag]);

  // Handle Delete Spark
  const handleDeleteSpark = (spark: SparkItem) => {
    showConfirm(t('sparks.deleteConfirm'), async () => {
      try {
        const res = await apiFetch('/api/sparks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filepath: spark.filepath })
        });
        if (res.ok) {
          await fetchNotes();
        }
      } catch (err: unknown) {
        console.error('Failed to delete spark:', err);
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 text-zinc-100">
      {/* 1. Header with Search & Filter Bar */}
      <PageHeader
        icon={Lightbulb}
        iconClassName="bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400"
        title={t('sparks.title')}
        count={filteredSparks.length}
        countClassName="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        actions={
          <>
            <IconButton
              icon={Search}
              size="md"
              variant={isSearchVisible || searchQuery || selectedTag ? 'amber' : 'default'}
              onClick={() => {
                setIsSearchVisible((prev) => !prev);
                if (isSearchVisible) {
                  setSearchQuery('');
                  setSelectedTag('');
                }
              }}
            />

            <IconButton
              icon={Plus}
              size="md"
              variant="primary-amber"
              onClick={() => openSparkModal()}
            />
          </>
        }
      >
        {(isSearchVisible || searchQuery || selectedTag) && (
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTag={selectedTag}
            onTagSelect={setSelectedTag}
            tags={sparkTags}
            placeholder={t('sparks.searchPlaceholder')}
            accentColor="amber"
          />
        )}
      </PageHeader>

      {/* 2. Scrollable Stream Container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 pb-32">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {/* Sparks Cards List */}
          {filteredSparks.length === 0 ? (
            <EmptyState icon={Lightbulb} title={t('sparks.empty')} />
          ) : (
            filteredSparks.map((spark) => (
              <div
                key={spark.filepath}
                className="px-4 py-3 rounded-2xl bg-zinc-900 border border-amber-500/35 hover:border-amber-500/70 flex flex-col gap-2 transition-all group"
              >
                {/* Content */}
                <p className="text-[13px] md:text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap select-text font-normal">
                  {spark.content}
                </p>

                {/* Tag List */}
                <TagList tags={spark.tags} />

                {/* Footer Info & Actions (Right Bottom) */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-850/50 text-[11px] text-zinc-500 select-none">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>{formatDate(spark.updated_at)}</span>
                  </span>

                  <div className="flex items-center gap-1.5 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconButton
                      icon={Edit3}
                      size="xs"
                      variant="amber"
                      shape="rounded-lg"
                      onClick={() => openSparkModal(spark)}
                    />
                    <IconButton
                      icon={Trash2}
                      size="xs"
                      variant="danger"
                      shape="rounded-lg"
                      onClick={() => handleDeleteSpark(spark)}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
