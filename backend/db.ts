import path from 'node:path';
import fs from 'node:fs';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import type { NoteMetadata, DbMetadataRow, AIConfig } from './types';

const __dirname = import.meta.dirname;

// Resolve notes directory (supports NOTES_DIR or DATA_DIR/notes env vars)
const getNotesDir = (): string => {
  const rawNotesDir = process.env.NOTES_DIR || (process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'notes') : '../notes');
  return path.isAbsolute(rawNotesDir) ? rawNotesDir : path.resolve(__dirname, rawNotesDir);
};

interface PreparedStatements {
  countMetadata: StatementSync;
  getMetadata: StatementSync;
  allMetadata: StatementSync;
  saveMetadata: StatementSync;
  deleteMetadata: StatementSync;
}

let db: DatabaseSync | null = null;
let stmts: PreparedStatements | null = null;

// Resolve config.json path
const getConfigPath = (): string => {
  const notesDir = getNotesDir();
  return path.join(notesDir, '.biunote', 'config.json');
};

// Read local configuration JSON
const readConfig = (): Record<string, string> => {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to read config.json:', msg);
  }
  return {};
};

// Write local configuration JSON
const writeConfig = (data: Record<string, string>): void => {
  try {
    const notesDir = getNotesDir();
    const biunoteDir = path.join(notesDir, '.biunote');
    if (!fs.existsSync(biunoteDir)) {
      fs.mkdirSync(biunoteDir, { recursive: true });
    }
    const configPath = path.join(biunoteDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to write config.json:', msg);
  }
};

// Initialize Database connection & prepared statements
const getDb = (): { db: DatabaseSync; stmts: PreparedStatements } => {
  if (!db || !stmts) {
    const notesDir = getNotesDir();
    const biunoteDir = path.join(notesDir, '.biunote');
    if (!fs.existsSync(biunoteDir)) {
      fs.mkdirSync(biunoteDir, { recursive: true });
    }

    const dbPath = path.join(biunoteDir, 'biunote.db');
    db = new DatabaseSync(dbPath);

    // Initialize Schema (pure metadata only)
    db.exec(`
      CREATE TABLE IF NOT EXISTS metadata (
        filepath TEXT PRIMARY KEY,
        hash TEXT,
        tags TEXT,
        updated_at REAL
      );
    `);

    // Prepare reusable statements
    stmts = {
      countMetadata: db.prepare('SELECT COUNT(*) AS count FROM metadata'),
      getMetadata: db.prepare('SELECT filepath, hash, tags, updated_at FROM metadata WHERE filepath = ?'),
      allMetadata: db.prepare('SELECT filepath, hash, tags, updated_at FROM metadata'),
      saveMetadata: db.prepare(`
        INSERT INTO metadata (filepath, hash, tags, updated_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(filepath) DO UPDATE SET hash = excluded.hash, tags = excluded.tags, updated_at = excluded.updated_at
      `),
      deleteMetadata: db.prepare('DELETE FROM metadata WHERE filepath = ?')
    };
  }
  return { db, stmts };
};

// Initialize DB schema
export const initDb = async (): Promise<void> => {
  try {
    const { stmts } = getDb();
    const countRow = stmts.countMetadata.get() as { count: number } | undefined;
    const totalCount = countRow ? countRow.count : 0;
    console.log(`Initialized SQLite database (node:sqlite) in notes/.biunote/biunote.db. Loaded ${totalCount} metadata records.`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to initialize SQLite database:', msg);
  }
};

// Get a setting from config.json
export const getSetting = async (key: string): Promise<string | null> => {
  const config = readConfig();
  return config[key] !== undefined ? config[key] : null;
};

// Set a setting to config.json
export const setSetting = async (key: string, value: string | number | boolean): Promise<void> => {
  const config = readConfig();
  config[key] = String(value);
  writeConfig(config);
};

// Get AI Config from config.json
export const getAIConfig = async (): Promise<AIConfig> => {
  const config = readConfig();
  const apiKey = config.openai_api_key || '';
  const baseUrl = config.openai_base_url || '';
  const model = config.openai_model || '';
  const embeddingModel = config.embedding_model || '';
  return { apiKey, baseUrl, model, embeddingModel };
};

// Save metadata for a note file
export const saveMetadata = async (
  filepath: string,
  hash: string,
  tags: string[],
  updated_at?: number
): Promise<void> => {
  const { stmts } = getDb();
  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);
  stmts.saveMetadata.run(filepath, hash || '', tagsJson, updated_at || Date.now());
};

// Format DB row into metadata object
const formatMetaRow = (row: DbMetadataRow | Record<string, unknown> | undefined | null): NoteMetadata | null => {
  if (!row) return null;
  const typedRow = row as DbMetadataRow;
  let parsedTags: string[] = [];
  try {
    parsedTags = JSON.parse(typedRow.tags || '[]');
  } catch {
    parsedTags = [];
  }
  return {
    filepath: String(typedRow.filepath),
    hash: String(typedRow.hash || ''),
    tags: parsedTags,
    updated_at: Number(typedRow.updated_at)
  };
};

// Get metadata for a specific file
export const getMetadata = async (filepath: string): Promise<NoteMetadata | null> => {
  const { stmts } = getDb();
  const row = stmts.getMetadata.get(filepath) as DbMetadataRow | undefined;
  return formatMetaRow(row);
};

// Get all notes metadata as an array
export const allMetadata = async (): Promise<NoteMetadata[]> => {
  const { stmts } = getDb();
  const rows = stmts.allMetadata.all() as unknown as DbMetadataRow[];
  return rows.map((r) => formatMetaRow(r)).filter((r): r is NoteMetadata => r !== null);
};

// Delete metadata for a note file
export const deleteMetadata = async (filepath: string): Promise<void> => {
  const { stmts } = getDb();
  stmts.deleteMetadata.run(filepath);
};
