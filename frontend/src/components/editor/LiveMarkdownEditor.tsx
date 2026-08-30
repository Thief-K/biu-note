import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Check, ListTree, Wand2, ArrowLeft, Eye, Edit3 } from 'lucide-react';
import { marked } from 'marked';
import { useNotesStore } from '../../stores/notesStore';
import { useModalStore } from '../../stores/modalStore';
import { apiFetch } from '../../utils/api';
import { useI18n } from '../../i18n';
import OutlineDrawer from '../common/OutlineDrawer';
import AiModifyDrawer from '../common/AiModifyDrawer';
import MarkdownViewer from '../common/MarkdownViewer';
import { TagList } from '../common/TagBadge';
import AlertBanner from '../common/AlertBanner';
import IconButton from '../common/IconButton';
import type { HeadingItem, NoteItem } from '../../types';

// Extracts title from first markdown heading or plain line
const extractTitleFromContent = (text: string): string => {
  const heading =
    (text || '').match(/^\s*#{1,6}\s+(.+)$/m)?.[1] ||
    (text || '').split('\n').find((l) => l.trim())?.slice(0, 30);
  return heading ? heading.replace(/[\\/:*?"<>|]/g, '').trim() : '';
};

export interface LiveMarkdownEditorProps {
  filepath: string;
  initialNote?: NoteItem | null;
  onSaved?: (filepath: string) => void;
}

export default function LiveMarkdownEditor({
  filepath,
  initialNote,
  onSaved
}: LiveMarkdownEditorProps) {
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const openDiff = useModalStore((s) => s.openDiff);
  const showConfirm = useModalStore((s) => s.showConfirm);
  const { t } = useI18n();
  const navigate = useNavigate();

  const isNew = filepath === 'new';
  const [content, setContent] = useState<string>(() => (isNew ? '' : initialNote?.content || ''));
  const [initialContent, setInitialContent] = useState<string>(() => (isNew ? '' : initialNote?.content || ''));
  const [tags, setTags] = useState<string[]>(() =>
    isNew ? [] : Array.isArray(initialNote?.tags) ? initialNote.tags : []
  );
  const [initialTags, setInitialTags] = useState<string[]>(() =>
    isNew ? [] : Array.isArray(initialNote?.tags) ? initialNote.tags : []
  );
  const [isPreview, setIsPreview] = useState<boolean>(() => !isNew);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const hasInitializedRef = useRef(isNew || !!initialNote);

  // Toggle preview mode with auto-focus on switching to edit
  const togglePreview = useCallback(() => {
    setIsPreview((prev) => {
      const next = !prev;
      if (!next) {
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
      return next;
    });
  }, []);

  // Sync content only once when initialNote loads asynchronously
  useEffect(() => {
    if (isNew || hasInitializedRef.current) return;
    if (initialNote) {
      hasInitializedRef.current = true;
      const noteContent = initialNote.content || '';
      const noteTags = Array.isArray(initialNote.tags) ? initialNote.tags : [];
      setContent(noteContent);
      setInitialContent(noteContent);
      setTags(noteTags);
      setInitialTags(noteTags);
    }
  }, [initialNote, isNew]);

  // Auto focus when creating a new note in edit mode
  useEffect(() => {
    if (isNew && !isPreview) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isNew, isPreview]);

  // Adjust textarea auto-height
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 400)}px`;
    }
  }, []);

  useEffect(() => {
    if (!isPreview) {
      adjustTextareaHeight();
    }
  }, [content, isPreview, adjustTextareaHeight]);

  // Check dirty state
  const isDirty = useMemo(() => {
    const contentChanged = content !== initialContent;
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(initialTags);
    return contentChanged || tagsChanged;
  }, [content, initialContent, tags, initialTags]);

  const canSave = isNew ? !!content.trim() : isDirty || savedSuccess;

  // Auto detect Title & Headings with anchor IDs for Outline TOC using marked.lexer (100% AST synced)
  const headings = useMemo<HeadingItem[]>(() => {
    if (!content) return [];
    try {
      const tokens = marked.lexer(content);
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
  }, [content]);

  // Strictly Manual Save (No git commit, pure disk + SQLite)
  const handleSave = async () => {
    if (saving || !canSave) return;
    setSaving(true);
    setEditorError('');

    let targetFile = '';
    if (isNew) {
      const titleExtracted = extractTitleFromContent(content);
      if (!titleExtracted) {
        setEditorError('请输入笔记内容');
        setSaving(false);
        return;
      }
      targetFile = `${titleExtracted}.md`;
    } else {
      targetFile = filepath;
    }

    try {
      const res = await apiFetch('/api/notes/raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: targetFile, content, tags })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || t('common.saveFailed'));
      }

      const data = (await res.json()) as { filepath: string };
      setInitialContent(content);
      setInitialTags([...tags]);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      await fetchNotes();

      // Switch to preview mode upon successful save
      setIsPreview(true);

      if (onSaved) onSaved(data.filepath);

      // If new note or renamed physical file, update route silently
      if (isNew || data.filepath !== filepath) {
        navigate(`/notes/${encodeURIComponent(data.filepath)}`, { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEditorError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Keyboard Shortcuts (Ctrl+S / Cmd+S manual save, Ctrl+P / Ctrl+Shift+V toggle preview)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        togglePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Guard against accidental navigation when unsaved
  const handleBack = () => {
    if (isDirty) {
      showConfirm(t('notes.unsavedConfirm'), () => {
        navigate('/notes');
      });
    } else {
      navigate('/notes');
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle AI Whole-note Modify
  const handleAiModify = async (presetMemo?: string) => {
    const memoToUse = presetMemo || '';
    if (!memoToUse.trim()) return;

    setAiLoading(true);
    setAiError('');
    try {
      const res = await apiFetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filepath: isNew ? 'Untitled.md' : filepath,
          content,
          memo: memoToUse
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || t('chat.error'));
      }

      const data = await res.json();
      setIsAiDrawerOpen(false);
      setAiError('');
      openDiff(data);
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

    if (isPreview) {
      // Preview Mode: Smooth scroll to rendered DOM element
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Edit Mode: Scroll container smoothly and position cursor without instant scroll jump
      const container = scrollContainerRef.current;
      const textarea = textareaRef.current;
      if (container && textarea && content) {
        const targetSearch = h.raw ? h.raw.trim() : h.text;
        let charIndex = targetSearch ? content.indexOf(targetSearch) : -1;
        if (charIndex === -1 && h.text) {
          charIndex = content.indexOf(h.text);
        }

        if (charIndex !== -1) {
          const textBefore = content.substring(0, charIndex);
          const lineIndex = textBefore.split('\n').length - 1;
          const totalLines = Math.max(content.split('\n').length, 1);
          const targetScrollTop = (textarea.offsetHeight * lineIndex) / totalLines;

          container.scrollTo({
            top: Math.max(0, targetScrollTop - 20),
            behavior: 'smooth'
          });

          // preventScroll: true prevents instant jarring scroll jump from browser focus
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(charIndex, charIndex + (targetSearch?.length || 0));
        }
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 text-zinc-100 relative">
      {/* 📍 1. Sticky Glass Top Navigation Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-855/50">
        {/* Left: Back button with dirty confirmation guard */}
        <IconButton
          icon={ArrowLeft}
          size="md"
          shape="rounded-full"
          className="text-zinc-400 hover:text-zinc-100 hover:scale-105"
          onClick={handleBack}
        />

        {/* Right: Save & Tool Capsules */}
        <div className="flex items-center gap-2">
          {/* Toggle Preview Button (VS Code style single pane toggle) */}
          <IconButton
            icon={isPreview ? Edit3 : Eye}
            size="md"
            shape="rounded-full"
            variant={isPreview ? 'blue' : 'default'}
            onClick={togglePreview}
          />

          {/* Save Button with Unsaved Dirty State Indicator: Only displayed in Edit mode */}
          {!isPreview && (
            <div className="relative">
              <IconButton
                icon={savedSuccess ? Check : Save}
                loading={saving}
                disabled={saving || !canSave}
                size="md"
                shape="rounded-full"
                variant={savedSuccess ? 'emerald' : canSave ? 'amber' : 'default'}
                onClick={handleSave}
              />
              {isDirty && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping pointer-events-none" />
              )}
            </div>
          )}

          {/* Outline TOC toggle: Only displayed in Preview mode when headings exist */}
          {isPreview && headings.length > 0 && (
            <IconButton
              icon={ListTree}
              size="md"
              shape="rounded-full"
              variant={isOutlineOpen ? 'emerald' : 'default'}
              onClick={() => setIsOutlineOpen((prev) => !prev)}
            />
          )}

          {/* AI Assistant Drawer toggle */}
          <IconButton
            icon={Wand2}
            size="md"
            shape="rounded-full"
            variant={isAiDrawerOpen ? 'emerald' : 'default'}
            onClick={() => setIsAiDrawerOpen((prev) => !prev)}
          />
        </div>
      </div>

      {/* 📝 2. Dominant Centered Canvas (Switch between Live Textarea and MarkdownViewer) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 select-none scroll-smooth"
        onClick={() => {
          if (!isPreview) textareaRef.current?.focus();
        }}
      >
        <div className="max-w-3xl mx-auto flex flex-col min-h-full">
          {editorError && (
            <div className="mb-4">
              <AlertBanner variant="error" message={editorError} />
            </div>
          )}

          {isPreview ? (
            /* 📖 High-Fidelity Preview Mode (100% shared rendering with mobile NoteReader) */
            <div className="flex-1 pb-16">
              {tags.length > 0 && (
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5 select-none">
                  <TagList tags={tags} />
                </div>
              )}

              {content.trim() ? (
                <MarkdownViewer content={content} />
              ) : (
                <div className="py-20 text-center text-xs text-zinc-500">
                  {t('editor.emptyPreview')}
                </div>
              )}
            </div>
          ) : (
            /* ✍️ Plain Markdown Textarea Editor Mode */
            <>
              {/* Tags Pills Bar with Tag capsule */}
              <div
                className="mb-2.5 flex flex-wrap items-center gap-1.5 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <TagList
                  tags={tags}
                  onTagRemove={(tagToRemove) => {
                    setTags(tags.filter((t) => t !== tagToRemove));
                  }}
                  onTagAdd={(newTag) => {
                    if (!tags.includes(newTag)) {
                      setTags([...tags, newTag]);
                    }
                  }}
                />
              </div>

              {/* Core Markdown Live Textarea (Adapting auto height) */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('editor.placeholder')}
                className="w-full flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed text-base md:text-[15px] font-mono select-text"
                style={{ minHeight: '500px' }}
              />
            </>
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

      {/* 🤖 4. AI Assistant Modify / Draft Drawer */}
      <AiModifyDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => {
          setIsAiDrawerOpen(false);
          setAiError('');
        }}
        onModify={handleAiModify}
        loading={aiLoading}
        error={aiError}
        isDraftMode={!content.trim()}
      />
    </div>
  );
}
