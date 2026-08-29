import path from 'node:path';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const __dirname = import.meta.dirname;

const runMigration = (): void => {
  const rawNotesDir =
    process.env.NOTES_DIR || (process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'notes') : '../../notes');
  const notesDir = path.isAbsolute(rawNotesDir) ? rawNotesDir : path.resolve(__dirname, rawNotesDir);
  const biunoteDir = path.join(notesDir, '.biunote');
  const dbPath = path.join(biunoteDir, 'biunote.db');
  const configPath = path.join(biunoteDir, 'config.json');

  if (!fs.existsSync(dbPath)) {
    console.log(`No database found at ${dbPath}, skipping migration.`);
    return;
  }

  console.log(`Connecting to database at ${dbPath}...`);
  const db = new DatabaseSync(dbPath);

  // Check if settings table exists
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get();
  if (!tableCheck) {
    console.log('Settings table does not exist or has already been migrated.');
    return;
  }

  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  console.log(`Found ${rows.length} settings rows in SQLite database.`);

  const configData: Record<string, string> = {};
  if (fs.existsSync(configPath)) {
    try {
      Object.assign(configData, JSON.parse(fs.readFileSync(configPath, 'utf8')));
    } catch {
      // ignore
    }
  }

  for (const row of rows) {
    if (row.key && row.value !== undefined) {
      configData[row.key] = row.value;
    }
  }

  // Write to config.json
  if (!fs.existsSync(biunoteDir)) {
    fs.mkdirSync(biunoteDir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2) + '\n', 'utf8');
  console.log(`Successfully migrated settings to ${configPath}:`, configData);

  // Drop settings table from SQLite to keep biunote.db pure and free of secrets
  db.exec('DROP TABLE IF EXISTS settings;');
  console.log('Dropped settings table from biunote.db.');
};

runMigration();
