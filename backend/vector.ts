import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AIConfig, VectorDb, SimilarResult } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve notes and .biunote directory
const getBiunoteDir = (): string => {
  const rawNotesDir = process.env.NOTES_DIR || (process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'notes') : '../notes');
  const notesDir = path.isAbsolute(rawNotesDir) ? rawNotesDir : path.resolve(process.cwd(), rawNotesDir);
  const biunoteDir = path.join(notesDir, '.biunote');
  if (!fs.existsSync(biunoteDir)) {
    fs.mkdirSync(biunoteDir, { recursive: true });
  }
  return biunoteDir;
};

const getVectorsPath = (): string => path.join(getBiunoteDir(), 'vectors.json');

// In-memory vector database
// Format: { [filepath]: { hash, vector: [...] } }
let vectorDb: VectorDb = {};

export const loadVectors = (): void => {
  const vectorsPath = getVectorsPath();
  try {
    if (fs.existsSync(vectorsPath)) {
      const data = fs.readFileSync(vectorsPath, 'utf8');
      vectorDb = JSON.parse(data);
      console.log(`Loaded ${Object.keys(vectorDb).length} cached vector embeddings from notes/.biunote/vectors.json.`);
    } else {
      vectorDb = {};
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to load vector cache, starting empty:', msg);
    vectorDb = {};
  }
};

export const saveVectors = (): void => {
  try {
    const biunoteDir = getBiunoteDir();
    const vectorsPath = path.join(biunoteDir, 'vectors.json');
    fs.writeFileSync(vectorsPath, JSON.stringify(vectorDb, null, 2), 'utf8');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to write vector cache to disk:', msg);
  }
};

// Calculate cosine similarity for two vectors
export const cosineSimilarity = (a?: number[] | null, b?: number[] | null): number => {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Get vector embedding from API
export const getEmbedding = async (text: string, config: AIConfig): Promise<number[]> => {
  const { apiKey, baseUrl, embeddingModel } = config;
  if (!apiKey || !embeddingModel) {
    throw new Error('Missing AI Configuration: Please configure API Key and Embedding Model in settings.');
  }

  // Clean URL format
  let cleanUrl = baseUrl.trim();
  if (!cleanUrl.startsWith('http')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  if (!cleanUrl.endsWith('/embeddings')) {
    cleanUrl = cleanUrl.replace(/\/+$/, '') + '/embeddings';
  }

  const response = await fetch(cleanUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: embeddingModel,
      input: text
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Embedding API Error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };
  if (!data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error('Invalid response structure received from Embedding API.');
  }

  return data.data[0].embedding;
};

// Update vector embedding in memory and disk
export const updateVector = async (
  filepath: string,
  content: string,
  hash: string,
  config: AIConfig
): Promise<void> => {
  try {
    // Truncate input content if too long to avoid token limits (first 8000 chars)
    const truncatedContent = content.slice(0, 8000);
    const vector = await getEmbedding(truncatedContent, config);
    vectorDb[filepath] = {
      hash,
      vector
    };
    saveVectors();
    console.log(`Updated vector embedding for: ${filepath}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to generate embedding for ${filepath}:`, msg);
  }
};

// Remove vector for deleted file
export const removeVector = (filepath: string): void => {
  if (vectorDb[filepath]) {
    delete vectorDb[filepath];
    saveVectors();
  }
};

// Check if vector exists and matches current content hash
export const hasVector = (filepath: string, hash: string): boolean => {
  return !!(vectorDb[filepath] && vectorDb[filepath].hash === hash);
};

// Semantic search based on query embedding
export const findSimilar = async (
  queryText: string,
  config: AIConfig,
  limit: number = 3
): Promise<SimilarResult[]> => {
  const queryEmbedding = await getEmbedding(queryText, config);
  const scored: SimilarResult[] = [];

  for (const [filepath, entry] of Object.entries(vectorDb)) {
    if (entry.vector && Array.isArray(entry.vector)) {
      const score = cosineSimilarity(queryEmbedding, entry.vector);
      scored.push({ filepath, similarity: score, score });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
};
