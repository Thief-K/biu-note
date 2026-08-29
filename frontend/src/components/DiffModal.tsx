import { useState, useEffect, useMemo, type FormEvent } from 'react';
import diff_match_patch from 'diff-match-patch';
import { Sparkles, Check, X, RotateCw } from 'lucide-react';
import { useI18n } from '../i18n';
import { apiFetch } from '../utils/api';
import AlertBanner from './common/AlertBanner';
import IconButton from './common/IconButton';
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
  const [editedTags, setEditedTags] = useState((data.proposed_tags || []).join(', '));

  // Interactive refining inside the modal
  const [refineMemo, setRefineMemo] = useState('');
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState('');
  const [currentData, setCurrentData] = useState<DiffData>(data);

  useEffect(() => {
    setCurrentData(data);
    setEditedTitle(data.proposed_title || '');
    setEditedContent(data.diff_content || '');
    setEditedTags((data.proposed_tags || []).join(', '));
  }, [data]);

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
          <span key={index} className="bg-red-500/20 text-red-300 line-through px-0.5 border border-red-500/20 rounded">
            {text}
          </span>
        );
      }
      return null; // Ignore insertions in the original view
    });
  };

  // Generate JSX for Right Column (Proposed content with highlighted inserts)
  const renderProposedDiff = () => {
    return diffs.map((diff, index) => {
      const [type, text] = diff;
      if (type === 0) {
        return <span key={index} className="text-zinc-300">{text}</span>;
      }
      if (type === 1) {
        return (
          <span key={index} className="bg-emerald-500/25 text-emerald-300 px-0.5 border border-emerald-500/20 rounded font-medium">
            {text}
          </span>
        );
      }
      return null; // Ignore deletions in the proposed view
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
        diff_content: resData.diff_content,
        proposed_title: resData.proposed_title || prev.proposed_title,
        proposed_tags: resData.proposed_tags || prev.proposed_tags
      }));
      if (resData.diff_content !== undefined) setEditedContent(resData.diff_content);
      if (resData.proposed_title) setEditedTitle(resData.proposed_title);
      if (resData.proposed_tags) setEditedTags(resData.proposed_tags.join(', '));
      setRefineMemo('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setRefining(false);
    }
  };

  const handleSave = () => {
    let targetFile = editedTitle.trim();
    if (!targetFile.endsWith('.md')) {
      targetFile += '.md';
    }

    // Tags are decoupled in SQLite, physical markdown remains pure plaintext
    const tagsList = editedTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onConfirm({
      filepath: targetFile,
      content: editedContent,
      tags: tagsList
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-6xl h-[90vh] bg-zinc-900 border border-zinc-700/80 rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header Banner */}
        <div
          className={`p-4 flex items-center justify-between shrink-0 select-none ${
            currentData.action === 'merge'
              ? 'bg-blue-500/10 border-b border-blue-500/20'
              : 'bg-emerald-500/10 border-b border-emerald-500/20'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                currentData.action === 'merge'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <Sparkles className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm">
                {currentData.action === 'merge' ? `✨ ${t('diff.mergeTitle')}` : `✨ ${t('diff.newTitle')}`}
              </h3>
              <p className="text-[10px] text-zinc-400">
                {currentData.action === 'merge'
                  ? t('diff.targetFile', { file: currentData.target_file || '' })
                  : t('diff.createFlat')}
              </p>
            </div>
          </div>
          <IconButton
            icon={X}
            size="xs"
            variant="ghost"
            shape="rounded-lg"
            onClick={onCancel}
          />
        </div>

        {/* Note title / tags inputs */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-950/40 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 shrink-0">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              {t('notes.title')}
            </label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder={t('notes.title')}
              className="w-full bg-zinc-900 border border-zinc-800/80 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              {t('common.tag')}
            </label>
            <input
              type="text"
              value={editedTags}
              onChange={(e) => setEditedTags(e.target.value)}
              placeholder={t('common.tag')}
              className="w-full bg-zinc-900 border border-zinc-800/80 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        {/* Dual Column Diff / Editor View */}
        <div className="flex-1 flex overflow-hidden bg-zinc-950/20">
          {currentData.action === 'merge' ? (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-900 h-full overflow-hidden">
              {/* Left Column: Old Version */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-900 bg-zinc-900/40 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider select-none">
                  {t('diff.original')}
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-mono text-xs whitespace-pre-wrap select-text leading-relaxed">
                  {renderOriginalDiff()}
                </div>
              </div>

              {/* Right Column: Proposed Version */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-900 bg-zinc-900/40 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider select-none">
                  {t('diff.proposed')}
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-mono text-xs whitespace-pre-wrap select-text leading-relaxed bg-zinc-900/10">
                  {renderProposedDiff()}
                </div>
              </div>
            </div>
          ) : (
            // New note preview & manual editor pane
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-900 bg-zinc-900/40 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider select-none">
                {t('diff.newContentPreview')}
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-full bg-transparent text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none resize-none font-mono leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Refine / Action Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0 flex flex-col gap-3">
          {error && <AlertBanner variant="error" message={error} />}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Refinement input */}
            <form
              onSubmit={handleRefine}
              className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider shrink-0 select-none py-1 sm:py-0">
                🗣️ {t('diff.refineLabel')}
              </span>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder={t('diff.refinePrompt')}
                  value={refineMemo}
                  onChange={(e) => setRefineMemo(e.target.value)}
                  disabled={refining}
                  className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 font-sans"
                />
                <IconButton
                  type="submit"
                  icon={RotateCw}
                  loading={refining}
                  disabled={refining || !refineMemo.trim()}
                  size="sm"
                  shape="rounded-xl"
                  variant="default"
                />
              </div>
            </form>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 shrink-0 select-none border-t border-zinc-900/60 pt-3 lg:pt-0 lg:border-0">
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
