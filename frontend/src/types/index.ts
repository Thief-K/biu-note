import type { ComponentType } from 'react';

export interface NoteItem {
  filepath: string;
  tags?: string[];
  updated_at?: number;
  content?: string;
}

export interface SparkItem {
  filepath: string;
  content?: string;
  tags?: string[];
  updated_at?: number;
}

export interface HeadingItem {
  index: number;
  level: number;
  text: string;
  raw?: string;
  id?: string;
}

export interface DiffData {
  action: 'create' | 'merge' | string;
  target_file?: string;
  proposed_title?: string;
  proposed_tags?: string[];
  diff_content?: string;
  original_content?: string;
}

export interface CandidateNote {
  filepath: string;
  title: string;
  type: 'spark' | 'note';
  content: string;
  tags: string[];
}

export interface ChatMessage {
  role: 'assistant' | 'user' | 'system' | string;
  content: string;
  referencedNotes?: CandidateNote[] | null;
}

export interface ConfirmOptions {
  danger?: boolean;
  icon?: string | ComponentType<{ size?: number | string; className?: string }>;
  variant?: string;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  message: string;
  onConfirm: (() => void) | null;
  confirmIcon: string | ComponentType<{ size?: number | string; className?: string }> | null;
  confirmVariant: string;
}

export interface SparkModalState {
  isOpen: boolean;
  spark: SparkItem | null;
}
