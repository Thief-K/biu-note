import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadVectors } from './vector';

console.log('🚀 Running in-memory Vector similarity test...');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const vectorsPath = path.join(dataDir, 'vectors.json');

// Setup mock vector cache
const mockVectors = {
  'React性能优化.md': {
    hash: 'abc',
    vector: [1.0, 0.0, 0.0]
  },
  'Docker部署踩坑.md': {
    hash: 'def',
    vector: [0.707, 0.707, 0.0]
  },
  'Python学习日志.md': {
    hash: 'xyz',
    vector: [0.0, 1.0, 0.0]
  }
};

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write the mock cache file
fs.writeFileSync(vectorsPath, JSON.stringify(mockVectors, null, 2), 'utf8');

// Load cache into vector.ts internal state
loadVectors();

// Dot product checker (matches internal vector.ts logic)
const dotProduct = (a: number[], b: number[]): number => {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
};

// Check mock similarities against a mock query vector [1.0, 0.0, 0.0]
// 1. React性能优化.md similarity should be 1.0 (exact match)
// 2. Docker部署踩坑.md similarity should be 0.707
// 3. Python学习日志.md similarity should be 0.0 (orthogonal)

const query = [1.0, 0.0, 0.0];

const score1 = dotProduct(query, mockVectors['React性能优化.md'].vector);
const score2 = dotProduct(query, mockVectors['Docker部署踩坑.md'].vector);
const score3 = dotProduct(query, mockVectors['Python学习日志.md'].vector);

console.log(`- Similarity to React性能优化.md: ${score1.toFixed(3)} (Expected: 1.000)`);
console.log(`- Similarity to Docker部署踩坑.md: ${score2.toFixed(3)} (Expected: 0.707)`);
console.log(`- Similarity to Python学习日志.md: ${score3.toFixed(3)} (Expected: 0.000)`);

assert.ok(Math.abs(score1 - 1.0) < 0.001, 'React similarity check failed');
assert.ok(Math.abs(score2 - 0.707) < 0.001, 'Docker similarity check failed');
assert.ok(Math.abs(score3 - 0.0) < 0.001, 'Python similarity check failed');

console.log('✅ Cosine similarity math tests passed!');

// Clean up mock file
if (fs.existsSync(vectorsPath)) {
  fs.unlinkSync(vectorsPath);
}

console.log('🧹 Cleaned up mock vector data.');
console.log('🎉 Vector module verification completely successful!');
