export interface NoteMetadata {
  filepath: string;
  hash: string;
  tags: string[];
  updated_at: number;
}

export interface DbMetadataRow {
  filepath: string;
  hash: string;
  tags: string;
  updated_at: number;
}

export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  embeddingModel: string;
}

export interface VectorEntry {
  hash: string;
  vector: number[];
}

export type VectorDb = Record<string, VectorEntry>;

export interface SimilarResult {
  filepath: string;
  similarity: number;
  score: number;
}

export interface RetrievedNoteCandidate {
  filepath: string;
  similarity: number;
  source: 'vector' | 'keyword';
}

export interface NoteItem {
  filepath: string;
  tags: string[];
  updated_at: number;
  content: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | string;
  content: string;
}

export interface AiProcessResponse {
  action: 'create' | 'merge';
  target_file: string;
  proposed_title?: string;
  proposed_tags?: string[];
  diff_content: string;
}

export interface GitResult {
  code: number;
  stdout: string;
  stderr: string;
}
