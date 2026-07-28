import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
const jsonPath = path.join(__dirname, 'db.json');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Lỗi kết nối SQLite:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT,
    collection TEXT,
    data TEXT,
    PRIMARY KEY (id, collection)
  )`);

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const dbJson = JSON.parse(rawData);

  const stmt = db.prepare(`INSERT OR REPLACE INTO documents (id, collection, data) VALUES (?, ?, ?)`);

  let count = 0;
  for (const collection in dbJson) {
    if (collection === '$schema') continue;
    
    const items = dbJson[collection];
    if (Array.isArray(items)) {
      items.forEach(item => {
        const id = item.id || `migrated_${Date.now()}_${Math.random()}`;
        if (!item.id) item.id = id;
        stmt.run(id, collection, JSON.stringify(item));
        count++;
      });
      console.log(`Đã migrate ${items.length} bản ghi cho collection: ${collection}`);
    }
  }

  stmt.finalize(() => {
    console.log(`Migrate thành công tổng cộng ${count} bản ghi!`);
    db.close();
  });
});
