import { useState, useEffect, useMemo, useRef, type FormEvent } from 'react';
import diff_match_patch from 'diff-match-patch';
import { Sparkles, Check, X, RotateCw, Tag, Plus, Eye, History, FileText } from 'lucide-react';
import { useI18n } from '../i18n';
import { apiFetch } from '../utils/api';
import AlertBanner from './common/AlertBanner';
import IconButton from './common/IconButton';
import { TagList } from './common/TagBadge';
import type { DiffData } from '../types';

export interface DiffModalCommitPayload {
  filepath: string;
  content: string;
  tags: string[];
}

export interface DiffModalProps {
  data: DiffData;
  onCancel: () => void;
  onConfirm: (payload: DiffModalCommitPayload) => void;
}

export default function DiffModal({ data, onCancel, onConfirm }: DiffModalProps) {
  const { t } = useI18n();
  const [editedTitle, setEditedTitle] = useState(data.proposed_title || '');
  const [editedContent, setEditedContent] = useState(data.diff_content || '');
  const [tags, setTags] = useState<string[]>(() => data.proposed_tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Mobile segmented view tab ('proposed' vs 'original')
  const [mobileTab, setMobileTab] = useState<'proposed' | 'original'>('proposed');

  // Interactive refining inside the modal
  const [refineMemo, setRefineMemo] = useState('');
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState('');
  const [currentData, setCurrentData] = useState<DiffData>(data);

  useEffect(() => {
    setCurrentData(data);
    setEditedTitle(data.proposed_title || '');
    setEditedContent(data.diff_content || '');
    setTags(data.proposed_tags || []);
  }, [data]);

  // Synchronized scrolling refs with active pane tracking
  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);
  const activePaneRef = useRef<'left' | 'right' | null>(null);

  // Synchronized scrolling handler
  const handleScroll = (source: 'left' | 'right') => {
    if (activePaneRef.current && activePaneRef.current !== source) return;

    const sourceEl = source === 'left' ? leftScrollRef.current : rightScrollRef.current;
    const targetEl = source === 'left' ? rightScrollRef.current : leftScrollRef.current;

    if (!sourceEl || !targetEl) return;

    const maxSourceScroll = sourceEl.scrollHeight - sourceEl.clientHeight;
    const maxTargetScroll = targetEl.scrollHeight - targetEl.clientHeight;

    if (maxSourceScroll > 0 && maxTargetScroll > 0) {
      const percentage = sourceEl.scrollTop / maxSourceScroll;
      targetEl.scrollTop = percentage * maxTargetScroll;
    } else {
      targetEl.scrollTop = sourceEl.scrollTop;
    }
    targetEl.scrollLeft = sourceEl.scrollLeft;
  };

  // Compute Diffs with memoization using diff-match-patch
  const diffs = useMemo(() => {
    const dmp = new diff_match_patch();
    const d = dmp.diff_main(currentData.original_content || '', editedContent);
    dmp.diff_cleanupSemantic(d);
    return d;
  }, [currentData.original_content, editedContent]);

  // Generate JSX for Left Column (Original content with highlighted deletes)
  const renderOriginalDiff = () => {
    return diffs.map((diff, index) => {
      const [type, text] = diff;
      if (type === 0) {
        return <span key={index} className="text-zinc-400">{text}</span>;
      }
      if (type === -1) {
        return (
          <span key={index} className="bg-red-500/20 text-red-300 line-through px-0.5 border border-red-500/30 rounded">
            {text}
          </span>
        );
      }
      return null;
    });
  };

  // Generate JSX for Right Column (Proposed content with highlighted inserts)
  const renderProposedDiff = () => {
    return diffs.map((diff, index) => {
      const [type, text] = diff;
      if (type === 0) {
        return <span key={index} className="text-zinc-200">{text}</span>;
      }
      if (type === 1) {
        return (
          <span key={index} className="bg-emerald-500/25 text-emerald-300 px-0.5 border border-emerald-500/30 rounded font-medium">
            {text}
          </span>
        );
      }
      return null;
    });
  };

  // Call AI again to refine the output
  const handleRefine = async (e: FormEvent) => {
    e.preventDefault();
    if (!refineMemo.trim()) return;

    setRefining(true);
    setError('');

    try {
      const response = await apiFetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filepath: currentData.target_file,
          content: editedContent,
          memo: refineMemo.trim()
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t('chat.error'));
      }

      const resData = (await response.json()) as DiffData;
      setCurrentData((prev) => ({
        ...prev,
        original_content: editedContent,
        diff_content: resData.diff_content,
        proposed_title: resData.proposed_title || prev.proposed_title,
        proposed_tags: resData.proposed_tags || prev.proposed_tags
      }));
      if (resData.diff_content !== undefined) setEditedContent(resData.diff_content);
      if (resData.proposed_title) setEditedTitle(resData.proposed_title);
      if (resData.proposed_tags) setTags(resData.proposed_tags);
      setRefineMemo('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setRefining(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleSave = () => {
    let targetFile = editedTitle.trim();
    if (!targetFile.endsWith('.md')) {
      targetFile += '.md';
    }

    onConfirm({
      filepath: targetFile,
      content: editedContent,
      tags
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 select-none animate-fade">
      <div className="w-full max-w-6xl h-[92vh] bg-zinc-900 border border-zinc-750 rounded-2xl flex flex-col overflow-hidden animate-slide-up shadow-2xl">
        {/* 1. Modal Header Banner */}
        <div
          className={`px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 select-none ${
            currentData.action === 'merge'
              ? 'bg-blue-500/10 border-b border-blue-500/20'
              : 'bg-emerald-500/10 border-b border-emerald-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
                currentData.action === 'merge'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                <span>{currentData.action === 'merge' ? t('diff.mergeTitle') : t('diff.newTitle')}</span>
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono truncate max-w-xs sm:max-w-md">
                {currentData.action === 'merge'
                  ? t('diff.targetFile', { file: currentData.target_file || '' })
                  : t('diff.createFlat')}
              </p>
            </div>
          </div>
          <IconButton
            icon={X}
            size="sm"
            variant="ghost"
            shape="rounded-lg"
            onClick={onCancel}
          />
        </div>

        {/* 2. Note Title & Tag Capsule Management */}
        <div className="px-4 sm:px-6 py-3 border-b border-zinc-800 bg-zinc-950/50 grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-500 shrink-0 select-none flex items-center gap-1">
              <FileText className="w-3 h-3 text-blue-400" />
              <span>{t('notes.title')}:</span>
            </span>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder={t('notes.title')}
              className="flex-1 bg-zinc-900 border border-zinc-750 focus:border-emerald-500/60 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap min-h-[32px]">
            <span className="text-[11px] font-semibold text-zinc-500 shrink-0 select-none flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-400" />
              <span>{t('common.tag')}:</span>
            </span>

            <TagList
              tags={tags}
              size="sm"
              onTagRemove={(tagToRemove) => setTags(tags.filter((t) => t !== tagToRemove))}
            />

            {isAddingTag ? (
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    } else if (e.key === 'Escape') {
                      setIsAddingTag(false);
                    }
                  }}
                  onBlur={handleAddTag}
                  placeholder={t('common.addTag')}
                  autoFocus
                  className="bg-zinc-900 border border-emerald-500/50 rounded-full px-2.5 py-0.5 text-xs text-emerald-400 placeholder-zinc-500 focus:outline-none w-20"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="h-5 px-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 text-[11px] leading-none flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95 shrink-0"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>{t('common.addTag')}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Mobile View Segmented Switcher */}
        {currentData.action === 'merge' && (
          <div className="md:hidden flex items-center border-b border-zinc-800 bg-zinc-950/60 p-1.5 shrink-0">
            <div className="grid grid-cols-2 gap-1 w-full">
              <button
                type="button"
                onClick={() => setMobileTab('proposed')}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mobileTab === 'proposed'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t('diff.proposed')}</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('original')}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mobileTab === 'original'
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>{t('diff.original')}</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Dual Column Diff / Editor View */}
        <div className="flex-1 flex overflow-hidden bg-zinc-950/30">
          {currentData.action === 'merge' ? (
            <div className="flex-1 flex flex-col md:grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800 h-full overflow-hidden">
              <div
                className={`flex-col h-full overflow-hidden ${
                  mobileTab === 'original' ? 'flex' : 'hidden md:flex'
                }`}
              >
                <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider select-none flex items-center justify-between">
                  <span>{t('diff.original')}</span>
                </div>
                <div
                  ref={leftScrollRef}
                  onMouseEnter={() => {
                    activePaneRef.current = 'left';
                  }}
                  onTouchStart={() => {
                    activePaneRef.current = 'left';
                  }}
                  onWheel={() => {
                    activePaneRef.current = 'left';
                  }}
                  onScroll={() => handleScroll('left')}
                  className="flex-1 p-4 sm:p-5 overflow-y-auto font-mono text-xs whitespace-pre-wrap select-text leading-relaxed text-zinc-400"
                >
                  {renderOriginalDiff()}
                </div>
              </div>

              <div
                className={`flex-col h-full overflow-hidden ${
                  mobileTab === 'proposed' ? 'flex' : 'hidden md:flex'
                }`}
              >
                <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider select-none flex items-center justify-between">
                  <span>{t('diff.proposed')}</span>
                </div>
                <div
                  ref={rightScrollRef}
                  onMouseEnter={() => {
                    activePaneRef.current = 'right';
                  }}
                  onTouchStart={() => {
                    activePaneRef.current = 'right';
                  }}
                  onWheel={() => {
                    activePaneRef.current = 'right';
                  }}
                  onScroll={() => handleScroll('right')}
                  className="flex-1 p-4 sm:p-5 overflow-y-auto font-mono text-xs whitespace-pre-wrap select-text leading-relaxed bg-zinc-900/15"
                >
                  {renderProposedDiff()}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider select-none">
                {t('diff.newContentPreview')}
              </div>
              <div className="flex-1 p-5 overflow-y-auto">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-full bg-transparent text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none font-mono leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. Refine & Action Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950 shrink-0 flex flex-col gap-3">
          {error && <AlertBanner variant="error" message={error} />}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <form
              onSubmit={handleRefine}
              className="flex-1 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={t('diff.refinePrompt')}
                value={refineMemo}
                onChange={(e) => setRefineMemo(e.target.value)}
                disabled={refining}
                className="flex-1 min-w-0 bg-zinc-900 border border-zinc-750 focus:border-emerald-500/60 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans transition-colors"
              />
              <IconButton
                type="submit"
                icon={RotateCw}
                loading={refining}
                disabled={refining || !refineMemo.trim()}
                size="md"
                shape="rounded-xl"
                variant={refineMemo.trim() && !refining ? 'primary' : 'default'}
              />
            </form>

            <div className="flex items-center justify-end gap-2 shrink-0 select-none pt-2 sm:pt-0 border-t sm:border-0 border-zinc-850">
              <IconButton
                icon={X}
                size="md"
                shape="rounded-xl"
                variant="default"
                onClick={onCancel}
              />
              <IconButton
                icon={Check}
                size="md"
                shape="rounded-xl"
                variant="primary"
                onClick={handleSave}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
