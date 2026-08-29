import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ListTree, Wand2 } from 'lucide-react';
import { marked } from 'marked';
import { useModalStore } from '../../stores/modalStore';
import { apiFetch } from '../../utils/api';
import { useI18n } from '../../i18n';
import MarkdownViewer from '../common/MarkdownViewer';
import OutlineDrawer from '../common/OutlineDrawer';
import AiModifyDrawer from '../common/AiModifyDrawer';
import { TagList } from '../common/TagBadge';
import IconButton from '../common/IconButton';
import type { HeadingItem, NoteItem } from '../../types';

export interface NoteReaderProps {
  note?: NoteItem | null;
}

export default function NoteReader({ note }: NoteReaderProps) {
  const openDiff = useModalStore((s) => s.openDiff);
  const { t } = useI18n();
  const navigate = useNavigate();

  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Extract headings from note content for TOC using marked.lexer (100% AST synced)
  const headings = useMemo<HeadingItem[]>(() => {
    if (!note?.content) return [];
    try {
      const tokens = marked.lexer(note.content);
      const list: HeadingItem[] = [];
      let headingIndex = 0;
      tokens.forEach((token) => {
        if (token.type === 'heading' && token.depth <= 3) {
          const text = (token.text || '').replace(/<[^>]*>/g, '').trim();
          list.push({
            index: headingIndex,
            level: token.depth,
            text,
            raw: token.raw,
            id: `heading-${headingIndex}`
          });
          headingIndex++;
        }
      });
      return list;
    } catch {
      return [];
    }
  }, [note?.content]);

  // Handle AI Whole-note Modify
  const handleAiModify = async (presetMemo?: string) => {
    if (!note) return;
    const memoToUse = presetMemo || '';
    if (!memoToUse.trim()) return;

    setAiLoading(true);
    setAiError('');
    try {
      const res = await apiFetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filepath: note.filepath,
          content: note.content,
          memo: memoToUse
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || t('chat.error'));
      }

      const data = await res.json();
      setIsAiDrawerOpen(false);
      openDiff({ ...data, original_content: note.content });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const scrollToHeading = (h: HeadingItem) => {
    setIsOutlineOpen(false);
    if (!h) return;
    const targetId = h.id || `heading-${h.index}`;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 text-zinc-100 relative">
      {/* 📍 1. Sticky Glass Top Navigation Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-850/50">
        {/* Left: Back button */}
        <IconButton
          icon={ArrowLeft}
          size="md"
          shape="rounded-full"
          className="text-zinc-400 hover:text-zinc-100 hover:scale-105"
          onClick={() => navigate('/notes')}
        />

        {/* Right: Tool Capsules */}
        <div className="flex items-center gap-2">
          {/* Outline TOC toggle: Only displayed when headings exist */}
          {headings.length > 0 && (
            <IconButton
              icon={ListTree}
              size="md"
              shape="rounded-full"
              className={
                isOutlineOpen
                  ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/40'
                  : 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }
              onClick={() => setIsOutlineOpen((prev) => !prev)}
            />
          )}

          {/* AI Assistant Modify button */}
          <IconButton
            icon={Wand2}
            size="md"
            shape="rounded-full"
            className={
              isAiDrawerOpen
                ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/40'
                : 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            }
            onClick={() => setIsAiDrawerOpen((prev) => !prev)}
          />
        </div>
      </div>

      {/* 📖 2. Pure Reader Scroll Container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 select-text scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col min-h-full pb-16">
          {/* Tags Display in Reader Mode */}
          {Array.isArray(note?.tags) && note.tags.length > 0 && (
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5 select-none">
              <TagList tags={note.tags} />
            </div>
          )}

          {/* Markdown Body (100% unified rendering with PC preview) */}
          {note?.content ? (
            <MarkdownViewer content={note.content} />
          ) : (
            <div className="py-20 text-center text-xs text-zinc-500">
              {t('editor.emptyPreview')}
            </div>
          )}
        </div>
      </div>

      {/* 📑 3. Slide-over Outline TOC Drawer */}
      <OutlineDrawer
        isOpen={isOutlineOpen}
        onClose={() => setIsOutlineOpen(false)}
        headings={headings}
        onSelectHeading={scrollToHeading}
      />

      {/* 🤖 4. AI Assistant Bottom Sheet / Drawer */}
      <AiModifyDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        onModify={handleAiModify}
        loading={aiLoading}
        error={aiError}
      />
    </div>
  );
}
