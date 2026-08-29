import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import type { GitResult } from './types';

const execAsync = promisify(exec);

const runCmd = async (cmd: string, cwd?: string): Promise<GitResult> => {
  try {
    const res = await execAsync(cmd, { cwd });
    return { code: 0, stdout: res.stdout || '', stderr: res.stderr || '' };
  } catch (error: unknown) {
    const err = error as { code?: number; stdout?: string; stderr?: string };
    return { code: err.code || 1, stdout: err.stdout || '', stderr: err.stderr || '' };
  }
};

let gitAvailable: boolean | null = null;

// Check if Git command is available in current environment
export const isGitAvailable = async (): Promise<boolean> => {
  if (gitAvailable !== null) return gitAvailable;
  const res = await runCmd('git --version');
  gitAvailable = res.code === 0;
  if (!gitAvailable) {
    console.warn('[BiuNote] Git not detected in system PATH. Versioning disabled, but note taking works normally.');
  }
  return gitAvailable;
};

export const initGit = async (notesDir: string): Promise<void> => {
  if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
  }

  // Ensure .gitignore ignores secrets (.biunote/config.json) and cache (.biunote/vectors.json)
  const gitignorePath = path.join(notesDir, '.gitignore');
  const ignorePatterns = [
    '.biunote/config.json',
    '.biunote/vectors.json',
    '.biunote/*.cache',
    '.DS_Store',
    'Thumbs.db'
  ];

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, ignorePatterns.join('\n') + '\n', 'utf8');
  } else {
    const existing = fs.readFileSync(gitignorePath, 'utf8');
    const existingLines = existing.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const toAdd = ignorePatterns.filter((p) => !existingLines.includes(p));
    if (toAdd.length > 0) {
      const merged = Array.from(new Set([...existingLines, ...toAdd]));
      fs.writeFileSync(gitignorePath, merged.join('\n') + '\n', 'utf8');
    }
  }

  // Check if Git is installed
  const hasGit = await isGitAvailable();
  if (!hasGit) return;

  if (!fs.existsSync(path.join(notesDir, '.git'))) {
    console.log('Initializing git repository in:', notesDir);
    await runCmd('git init', notesDir);

    // Set fallback git configurations locally to avoid commit failures
    const nameCheck = await runCmd('git config user.name', notesDir);
    if (!nameCheck.stdout.trim()) {
      await runCmd('git config user.name "BiuNote"', notesDir);
    }
    const emailCheck = await runCmd('git config user.email', notesDir);
    if (!emailCheck.stdout.trim()) {
      await runCmd('git config user.email "agent@biunote.local"', notesDir);
    }

    // Create initial placeholder if directory empty
    const files = fs.readdirSync(notesDir).filter((f) => f !== '.git' && f !== '.gitignore' && !f.startsWith('.'));
    if (files.length === 0) {
      fs.writeFileSync(path.join(notesDir, 'README.md'), '# BiuNote\n\n开启你的纯粹 Markdown 笔记之旅。\n');
    }

    await runCmd('git add .', notesDir);
    await runCmd('git commit -m "Initial commit by BiuNote"', notesDir);
  }
};

export const commitFile = async (notesDir: string, filepath: string, message: string): Promise<GitResult> => {
  const hasGit = await isGitAvailable();
  if (!hasGit) {
    return { code: 0, stdout: 'Git versioning disabled (git not found)', stderr: '' };
  }

  await runCmd(`git add "${filepath}"`, notesDir);
  // Run git commit, handling spaces in filepaths
  const res = await runCmd(`git commit -m "${message.replace(/"/g, '\\"')}"`, notesDir);
  return res;
};
