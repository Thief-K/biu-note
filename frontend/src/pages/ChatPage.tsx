import { useState, useRef, useEffect, useMemo, type ChangeEvent, type KeyboardEvent, type FormEvent } from 'react';
import { Bot, Send, User, Trash2, Loader2, Settings, FileText, Lightbulb, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotesStore } from '../stores/notesStore';
import { useModalStore } from '../stores/modalStore';
import { apiFetch } from '../utils/api';
import { isSparkOrTask } from '../utils/note';
import { useI18n } from '../i18n';
import PageHeader from '../components/common/PageHeader';
import AlertBanner from '../components/common/AlertBanner';
import IconButton from '../components/common/IconButton';
import MarkdownViewer from '../components/common/MarkdownViewer';
import type { CandidateNote, ChatMessage } from '../types';

export default function ChatPage() {
  const aiConfigured = useNotesStore((s) => s.aiConfigured);
  const allNotes = useNotesStore((s) => s.allNotes);
  const showConfirm = useModalStore((s) => s.showConfirm);
  const { t } = useI18n();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: t('chat.welcome')
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedNotes, setSelectedNotes] = useState<CandidateNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mention State
  const [mentionState, setMentionState] = useState({
    isOpen: false,
    query: '',
    matchStart: -1,
    matchEnd: -1
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mentionItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea height with exact reset on empty
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      if (input) {
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
      }
    }
  }, [input]);

  // Transform all notes into clean candidates
  const candidates = useMemo<CandidateNote[]>(() => {
    if (!allNotes || allNotes.length === 0) return [];
    return allNotes.map((n) => {
      const isSpark = isSparkOrTask(n.filepath);
      let title = '';
      if (isSpark) {
        title = (n.content || '').trim().replace(/\n+/g, ' ').slice(0, 36) || n.filepath;
      } else {
        const base = n.filepath.split('/').pop() || n.filepath;
        title = base.replace(/\.md$/i, '');
      }
      return {
        filepath: n.filepath,
        title,
        type: isSpark ? 'spark' : 'note',
        content: n.content || '',
        tags: n.tags || []
      };
    });
  }, [allNotes]);

  // Filter candidates based on mention query (exclude already selected notes)
  const filteredCandidates = useMemo<CandidateNote[]>(() => {
    if (!mentionState.isOpen) return [];
    const q = mentionState.query.toLowerCase().trim();
    const selectedPaths = new Set(selectedNotes.map((n) => n.filepath));
    const available = candidates.filter((item) => !selectedPaths.has(item.filepath));

    if (!q) return available.slice(0, 12);
    return available
      .filter((item) => {
        return (
          item.filepath.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          (Array.isArray(item.tags) && item.tags.some((tag) => tag.toLowerCase().includes(q)))
        );
      })
      .slice(0, 12);
  }, [candidates, mentionState.isOpen, mentionState.query, selectedNotes]);

  // Scroll active item into view
  useEffect(() => {
    if (mentionState.isOpen && mentionItemRefs.current[selectedIndex]) {
      mentionItemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, mentionState.isOpen]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    setInput(val);

    // Detect unclosed @mention before cursor
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/(?:^|\s)@([^@\s]*)$/);

    if (match) {
      const matchQuery = match[1];
      const matchStart = cursor - matchQuery.length - 1;
      setMentionState({
        isOpen: true,
        query: matchQuery,
        matchStart,
        matchEnd: cursor
      });
      setSelectedIndex(0);
    } else {
      setMentionState({ isOpen: false, query: '', matchStart: -1, matchEnd: -1 });
    }
  };

  const handleSelectCandidate = (candidate: CandidateNote) => {
    if (!candidate) return;
    setSelectedNotes((prev) => {
      if (prev.some((n) => n.filepath === candidate.filepath)) return prev;
      return [...prev, candidate];
    });

    // Strip @query from text
    const before = input.slice(0, mentionState.matchStart);
    const after = input.slice(mentionState.matchEnd);
    const nextInput = (before + after).trimStart();
    setInput(nextInput);
    setMentionState({ isOpen: false, query: '', matchStart: -1, matchEnd: -1 });

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleRemoveNote = (filepath: string) => {
    setSelectedNotes((prev) => prev.filter((n) => n.filepath !== filepath));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionState.isOpen && filteredCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCandidates.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCandidates.length) % filteredCandidates.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectCandidate(filteredCandidates[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionState({ isOpen: false, query: '', matchStart: -1, matchEnd: -1 });
        return;
      }
    }

    // Backspace removes last chip if input is empty
    if (e.key === 'Backspace' && !input && selectedNotes.length > 0) {
      setSelectedNotes((prev) => prev.slice(0, -1));
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!aiConfigured || (!input.trim() && selectedNotes.length === 0) || loading) return;

    const currentSelectedNotes = [...selectedNotes];
    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      referencedNotes: currentSelectedNotes.length > 0 ? currentSelectedNotes : null
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    setInput('');
    setSelectedNotes([]);
    setMentionState({ isOpen: false, query: '', matchStart: -1, matchEnd: -1 });
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          activeNoteFiles: currentSelectedNotes.map((n) => n.filepath)
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || t('chat.error'));
      }

      const data = (await res.json()) as { content: string };
      setMessages([...newMessages, { role: 'assistant', content: data.content }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const canClear = messages.length > 1;

  const handleClearChat = () => {
    if (!canClear) return;
    showConfirm(t('chat.clearConfirm'), () => {
      setMessages([
        {
          role: 'assistant',
          content: t('chat.welcome')
        }
      ]);
      setError('');
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 text-zinc-100">
      {/* 1. Header */}
      <PageHeader
        onBack={() => {
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
          } else {
            navigate('/notes');
          }
        }}
        title={t('chat.title')}
        actions={
          <IconButton
            icon={Trash2}
            size="md"
            variant={canClear ? 'danger' : 'default'}
            disabled={!canClear}
            className={!canClear ? 'opacity-30 cursor-not-allowed' : ''}
            onClick={handleClearChat}
          />
        }
      />

      {/* 2. Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 pb-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {!aiConfigured && (
            <AlertBanner
              variant="warning"
              message={t('chat.noConfig')}
              action={
                <IconButton
                  icon={Settings}
                  variant="amber"
                  size="xs"
                  shape="rounded-lg"
                  onClick={() => navigate('/settings')}
                />
              }
            />
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isUser
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                      : 'bg-purple-500/10 border-purple-500/25 text-purple-400'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble & External Attachments */}
                {isUser ? (
                  <div className="flex flex-col items-end gap-1.5 max-w-[85%] md:max-w-[75%]">
                    {/* Subtle & Elegant User Bubble */}
                    <div className="rounded-2xl px-4 py-3 bg-purple-950/40 border border-purple-800/40 text-purple-100 shadow-none select-text text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>

                    {/* External Referenced Attachment Chips (Outside the bubble) */}
                    {msg.referencedNotes && msg.referencedNotes.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-1.5 px-0.5 select-none">
                        {msg.referencedNotes.map((note) => (
                          <div
                            key={note.filepath}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 border border-zinc-800 text-zinc-400 rounded-lg text-xs font-mono"
                          >
                            {note.type === 'spark' ? (
                              <Lightbulb className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-purple-400/80 shrink-0" />
                            )}
                            <span className="font-medium truncate max-w-[200px] leading-none text-zinc-300">
                              {note.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-[90%] md:max-w-[85%] rounded-2xl px-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-100 select-text overflow-hidden">
                    <MarkdownViewer content={msg.content} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>{t('chat.thinking')}</span>
              </div>
            </div>
          )}

          {error && <AlertBanner variant="error" message={error} />}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 3. Integrated Input Bar at Bottom */}
      <div className="px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:py-4 border-t border-zinc-850 bg-zinc-950/95 backdrop-blur-xl shrink-0 select-none">
        <div className="max-w-3xl mx-auto relative">
          {/* Minimalist Mention Popover */}
          {mentionState.isOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 max-h-60 overflow-y-auto bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-1.5 flex flex-col gap-0.5 backdrop-blur-xl">
              {filteredCandidates.length === 0 ? (
                <div className="px-3 py-4 text-xs text-zinc-500 text-center">
                  {t('chat.mentionEmpty')}
                </div>
              ) : (
                filteredCandidates.map((item, idx) => {
                  const isSelected = idx === selectedIndex;

                  return (
                    <button
                      key={item.filepath}
                      ref={(el) => {
                        mentionItemRefs.current[idx] = el;
                      }}
                      type="button"
                      onClick={() => handleSelectCandidate(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : 'text-zinc-300 hover:bg-zinc-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.type === 'spark' ? (
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        )}
                        <span className="font-medium truncate font-mono">{item.title}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Unified Form Container: Top Chips Bar + Bottom Pure Textarea */}
          <form onSubmit={handleSend} className="relative flex flex-col">
            <div className="flex flex-col w-full bg-zinc-900/90 border border-zinc-800 focus-within:border-purple-500/50 rounded-2xl px-3.5 py-2 transition-all">
              {/* Top: Selected Notes Attachment Chips Bar */}
              {selectedNotes.length > 0 && (
                <div className="flex items-center flex-wrap gap-1.5 pb-2 mb-1.5 border-b border-zinc-800/80 select-none">
                  {selectedNotes.map((note) => (
                    <div
                      key={note.filepath}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-mono select-none animate-in fade-in zoom-in-95 shrink-0"
                    >
                      {note.type === 'spark' ? (
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      )}
                      <span className="font-medium truncate max-w-[180px] sm:max-w-[260px] leading-none">
                        {note.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNote(note.filepath)}
                        className="p-0.5 hover:bg-purple-500/25 rounded text-purple-400 hover:text-purple-200 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom: Pure Textarea Input + Send Button */}
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={!aiConfigured || loading}
                  placeholder={
                    !aiConfigured
                      ? t('chat.noConfig')
                      : selectedNotes.length > 0
                      ? '输入关于所选笔记的问题...'
                      : t('chat.placeholder')
                  }
                  rows={1}
                  className="flex-1 min-w-[120px] max-h-36 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none select-text disabled:opacity-40 disabled:cursor-not-allowed py-1 leading-6 outline-none"
                />

                <IconButton
                  type="submit"
                  icon={Send}
                  loading={loading}
                  disabled={loading || (!input.trim() && selectedNotes.length === 0) || !aiConfigured}
                  size="sm"
                  shape="rounded-xl"
                  variant={
                    (input.trim() || selectedNotes.length > 0) && !loading && aiConfigured
                      ? 'primary-purple'
                      : 'default'
                  }
                  className={`w-8 h-8 shrink-0 ${
                    !(input.trim() || selectedNotes.length > 0) || loading || !aiConfigured
                      ? 'opacity-40 cursor-not-allowed'
                      : ''
                  }`}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
