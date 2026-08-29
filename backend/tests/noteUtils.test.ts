import { describe, it, expect } from 'vitest';
import {
  isSparkOrTask,
  extractTitleFromContent,
  cleanContentPureMarkdown,
  extractTags,
  getSafeRelativePath,
  getHash
} from '../lib/noteUtils';
import { cosineSimilarity } from '../vector';

describe('Note Invariants & Utilities (backend/lib/noteUtils)', () => {
  describe('isSparkOrTask', () => {
    it('correctly identifies spark files', () => {
      expect(isSparkOrTask('sparks/1783587002574.md')).toBe(true);
      expect(isSparkOrTask('sparks\\1783587002574.md')).toBe(true);
    });

    it('correctly identifies task files', () => {
      expect(isSparkOrTask('tasks/todo-2026.md')).toBe(true);
      expect(isSparkOrTask('tasks\\sub\\todo.md')).toBe(true);
    });

    it('returns false for regular notes', () => {
      expect(isSparkOrTask('technology/react-guide.md')).toBe(false);
      expect(isSparkOrTask('my-first-note.md')).toBe(false);
      expect(isSparkOrTask('not_sparks_but_note.md')).toBe(false);
    });
  });

  describe('extractTitleFromContent', () => {
    it('extracts first H1 title from Markdown', () => {
      const md = '# 深入理解 Node.js 事件循环\n\n事件循环是 Node.js 核心机制...';
      expect(extractTitleFromContent(md)).toBe('深入理解 Node.js 事件循环');
    });

    it('falls back to the first non-empty line if no H1 exists', () => {
      const md = '\n\n无标题的第一行内容\n第二行内容';
      expect(extractTitleFromContent(md)).toBe('无标题的第一行内容');
    });

    it('handles empty or blank content gracefully', () => {
      expect(extractTitleFromContent('')).toBe('');
      expect(extractTitleFromContent('   \n\n   ')).toBe('');
    });
  });

  describe('cleanContentPureMarkdown (Note Invariant: 100% Pure Markdown)', () => {
    it('strips YAML frontmatter completely', () => {
      const md = `---
title: 测试笔记
tags: nodejs, fastify
date: 2026-08-25
---

# 正文标题
这里是纯净的正文内容。`;

      const cleaned = cleanContentPureMarkdown(md);
      expect(cleaned).not.toContain('---');
      expect(cleaned).not.toContain('tags: nodejs');
      expect(cleaned.trim()).toBe('# 正文标题\n这里是纯净的正文内容。');
    });

    it('strips standalone hashtag-only lines at the end', () => {
      const md = `# 学习笔记

今天学习了 Vitest 单元测试框架。

#vitest #testing #nodejs`;

      const cleaned = cleanContentPureMarkdown(md);
      expect(cleaned).not.toContain('#vitest #testing #nodejs');
      expect(cleaned.trim()).toBe('# 学习笔记\n\n今天学习了 Vitest 单元测试框架。');
    });

    it('preserves inline #tags within sentences', () => {
      const md = `# 随手记\n这是一个非常 #重要 的技术细节，请注意。`;
      const cleaned = cleanContentPureMarkdown(md);
      expect(cleaned.trim()).toBe('# 随手记\n这是一个非常 #重要 的技术细节，请注意。');
    });
  });

  describe('extractTags', () => {
    it('extracts tags from YAML frontmatter', () => {
      const md = `---
tags: frontend, react, vite
---
# React 开发`;
      const tags = extractTags(md);
      expect(tags).toEqual(expect.arrayContaining(['frontend', 'react', 'vite']));
    });

    it('extracts inline hashtags from markdown text', () => {
      const md = `今天研究了 #AI 和 #LLM 架构。另外还有 #深度学习 的论文。`;
      const tags = extractTags(md);
      expect(tags).toEqual(expect.arrayContaining(['AI', 'LLM', '深度学习']));
    });

    it('ignores hashtags inside code blocks', () => {
      const md = `# Python 脚本
\`\`\`python
# 这是 Python 代码里的注释
print("hello")
\`\`\`
这是外部的标签 #python-tag`;
      const tags = extractTags(md);
      expect(tags).toContain('python-tag');
      expect(tags).not.toContain('这是');
    });
  });

  describe('getSafeRelativePath', () => {
    it('accepts safe relative paths', () => {
      expect(getSafeRelativePath('notes/test.md')).toBe('notes/test.md');
      expect(getSafeRelativePath('sparks/123.md')).toBe('sparks/123.md');
    });

    it('throws on path traversal attempts', () => {
      expect(() => getSafeRelativePath('../notes.md')).toThrow();
      expect(() => getSafeRelativePath('foo/../../secret.txt')).toThrow();
    });
  });

  describe('getHash', () => {
    it('generates consistent MD5 hash', () => {
      const h1 = getHash('hello world');
      const h2 = getHash('hello world');
      const h3 = getHash('different content');
      expect(h1).toBe(h2);
      expect(h1).not.toBe(h3);
      expect(typeof h1).toBe('string');
      expect(h1.length).toBe(32);
    });
  });
});

describe('Vector & Cosine Similarity Math (backend/vector.ts)', () => {
  it('calculates cosine similarity accurately regardless of vector norm', () => {
    const v1 = [1, 0, 0];
    const v2 = [2, 0, 0];
    const v3 = [0, 1, 0];
    const v4 = [-1, 0, 0];

    // Same direction -> 1
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0);
    // Orthogonal -> 0
    expect(cosineSimilarity(v1, v3)).toBeCloseTo(0.0);
    // Opposite -> -1
    expect(cosineSimilarity(v1, v4)).toBeCloseTo(-1.0);
  });

  it('handles empty or zero vectors safely', () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
    expect(cosineSimilarity(null, [1, 2])).toBe(0);
  });
});
