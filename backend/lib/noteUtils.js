import crypto from 'node:crypto';
import path from 'node:path';

// Compute MD5 hash using Node.js built-in crypto.hash
export const getHash = (content) => {
  return crypto.hash('md5', content || '', 'hex');
};

// Extracts tags from Frontmatter or inline Markdown #tags
export const extractTags = (content) => {
  if (!content) return [];
  const tags = new Set();

  // 1. Parse YAML frontmatter if exists
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatterMatch) {
    const tagMatch = frontmatterMatch[1].match(/(?:tags\s*:\s*\[?)([^\]\r\n]+)/i);
    if (tagMatch) {
      tagMatch[1].split(',').forEach(t => {
        const clean = t.trim().replace(/^['"]|['"]$/g, '');
        if (clean) tags.add(clean);
      });
    }
  }

  // 2. Parse inline tags (excluding code blocks)
  const body = frontmatterMatch ? content.slice(frontmatterMatch[0].length) : content;
  const cleanBody = body.replace(/```[\s\S]*?```|`[^`]*`/g, '');
  const tagRegex = /#([\w\u4e00-\u9fa5-_]+)/g;
  let match;
  while ((match = tagRegex.exec(cleanBody)) !== null) {
    tags.add(match[1]);
  }

  return Array.from(tags);
};

// Strips YAML frontmatter and hashtag-only lines completely to store 100% pure Markdown content
export const cleanContentPureMarkdown = (content) => {
  if (!content) return '\n';
  return content
    .replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
    .replace(/^\s*(?:#[\w\u4e00-\u9fa5-_]+\s*)+$/gm, '')
    .trim() + '\n';
};

// Extract title from markdown content (first H1 line)
export const extractTitleFromContent = (text) => {
  if (!text) return '';
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.replace('# ', '').trim();
    } else if (trimmed) {
      return trimmed; // Fallback to first non-empty line
    }
  }
  return '';
};

// Safe filepath resolver to prevent path traversal
export const getSafeRelativePath = (filepath) => {
  const normalized = filepath.replace(/\\/g, '/');
  if (normalized.includes('..') || path.isAbsolute(normalized)) {
    throw new Error('Invalid filepath format or path traversal attempt.');
  }
  return normalized;
};

// Check if file is a spark or task
export const isSparkOrTask = (filepath) => {
  const normalized = (filepath || '').replace(/\\/g, '/');
  return normalized.includes('sparks/') || normalized.includes('tasks/');
};
