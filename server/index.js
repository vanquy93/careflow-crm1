import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Lỗi khi mở database SQLite', err.message);
  } else {
    console.log('Kết nối thành công đến database.sqlite');
    db.run(`CREATE TABLE IF NOT EXISTS documents (
      id TEXT,
      collection TEXT,
      data TEXT,
      PRIMARY KEY (id, collection)
    )`);
  }
});

const getDocuments = (collection, filters = {}) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM documents WHERE collection = ?`, [collection], (err, rows) => {
      if (err) reject(err);
      else {
        let docs = rows.map(r => JSON.parse(r.data));
        
        if (Object.keys(filters).length > 0) {
          docs = docs.filter(doc => {
            for (const key in filters) {
              if (String(doc[key]) !== String(filters[key])) return false;
            }
            return true;
          });
        }
        resolve(docs);
      }
    });
  });
};

const insertDocument = (collection, id, data) => {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO documents (id, collection, data) VALUES (?, ?, ?)`, [id, collection, JSON.stringify(data)], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

const updateDocument = (collection, id, data) => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE documents SET data = ? WHERE id = ? AND collection = ?`, [JSON.stringify(data), id, collection], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

const deleteDocument = (collection, id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM documents WHERE id = ? AND collection = ?`, [id, collection], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Serve React frontend (production build) - BEFORE API routes
const distPath = path.join(__dirname, '../dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('Serving React frontend from dist/');
}

app.get('/:collection', async (req, res) => {
  try {
    const docs = await getDocuments(req.params.collection, req.query);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/:collection', async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || `gen_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    data.id = id;
    await insertDocument(req.params.collection, id, data);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/:collection/:id', async (req, res) => {
  try {
    const data = req.body;
    data.id = req.params.id;
    await updateDocument(req.params.collection, req.params.id, data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/:collection/:id', async (req, res) => {
  try {
    db.get(`SELECT data FROM documents WHERE id = ? AND collection = ?`, [req.params.id, req.params.collection], async (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Not found' });

      const existingData = JSON.parse(row.data);
      const updatedData = { ...existingData, ...req.body, id: req.params.id };
      await updateDocument(req.params.collection, req.params.id, updatedData);
      res.json(updatedData);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/:collection/:id', async (req, res) => {
  try {
    await deleteDocument(req.params.collection, req.params.id);
    res.json({});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback - must be LAST
if (existsSync(distPath)) {
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server (Express + SQLite) đang chạy tại http://0.0.0.0:${port}`);
});
