import { useMemo, useCallback, type MouseEvent } from 'react';
import { marked, type Tokens } from 'marked';
import hljs from 'highlight.js';

export interface MarkdownViewerProps {
  content?: string;
  className?: string;
}

/**
 * 共享的高保真 Markdown 渲染器组件
 * 采用 Renderer 阶段同步语法高亮 + 事件委托，100% 确定性保证刷新与切换时高亮与复制按钮即时生效
 */
export default function MarkdownViewer({ content = '', className = '' }: MarkdownViewerProps) {
  // Marked HTML generation with synchronous syntax highlighting and copy buttons
  const htmlContent = useMemo(() => {
    if (!content) return '';
    const renderer = new marked.Renderer();
    let headingRenderIndex = 0;

    // 1. Heading anchor IDs generator matching Outline TOC indices
    renderer.heading = function ({ tokens, depth }: Tokens.Heading) {
      const text = this.parser.parseInline(tokens);
      let id = '';
      if (depth <= 3) {
        id = `heading-${headingRenderIndex++}`;
      } else {
        const cleanText = text.replace(/<[^>]*>/g, '').trim();
        id = cleanText.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
      }

      return `<h${depth} id="${id}">${text}</h${depth}>`;
    };

    // 2. Synchronous code block highlighting + embedded copy button markup
    renderer.code = function ({ text, lang }: Tokens.Code) {
      const rawLang = (lang || '').trim().split(/\s+/)[0];
      const validLang = rawLang && hljs.getLanguage(rawLang) ? rawLang : null;
      let highlighted = '';
      try {
        highlighted = validLang
          ? hljs.highlight(text, { language: validLang, ignoreIllegals: true }).value
          : hljs.highlightAuto(text).value;
      } catch {
        highlighted = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      return `<div class="code-block-wrapper relative group my-4"><button type="button" class="code-copy-btn absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 transition-all border border-zinc-750/50 shadow cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button><pre class="overflow-x-auto"><code class="hljs ${validLang ? `language-${validLang}` : ''}">${highlighted}</code></pre></div>`;
    };

    return marked.parse(content, {
      gfm: true,
      breaks: true,
      renderer
    }) as string;
  }, [content]);

  // Event delegation for code copy buttons (Fixed in place, won't drift with x-axis scroll)
  const handleClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    const btn = target?.closest('.code-copy-btn');
    if (!btn) return;

    e.stopPropagation();
    const wrapper = btn.closest('.code-block-wrapper') || btn.closest('pre');
    const code = wrapper ? wrapper.querySelector('code') : null;
    if (code) {
      const text = code.innerText || code.textContent || '';
      navigator.clipboard.writeText(text);
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
      setTimeout(() => {
        btn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
      }, 1500);
    }
  }, []);

  return (
    <div
      onClick={handleClick}
      className={`markdown-preview-body text-sm text-zinc-300 leading-relaxed max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
