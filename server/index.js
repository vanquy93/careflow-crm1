import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'careflow-super-secret-key-change-in-production';

app.use(helmet({
  contentSecurityPolicy: false, // Tắt CSP để React app tự load tài nguyên
}));
app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Quá nhiều request, vui lòng thử lại sau 15 phút.'
});
app.use('/login', apiLimiter);

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

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Truy cập bị từ chối' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    req.user = user;
    next();
  });
};

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = await getDocuments('users');
    const emailLower = email ? email.toLowerCase() : '';
    const user = users.find(u => 
      ((u.email && u.email.toLowerCase() === emailLower) || 
       (u.id && u.id.toLowerCase() === emailLower) || 
       (u.phone === email)) 
      && !u.isDeleted
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không đúng' });
    }
    
    let isMatch = false;
    if (user.password && user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      if (user.password === password) {
        isMatch = true;
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await updateDocument('users', user.id, user);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

const VALID_COLLECTIONS = ['activities', 'contacts', 'auditLogs', 'campaigns', 'emails', 'customers', 'deals', 'deal_stages', 'notifications', 'projects', 'users'];
const checkCollection = (req, res, next) => {
  if (VALID_COLLECTIONS.includes(req.params.collection)) {
    return next();
  }
  next('route'); // Bỏ qua nếu không phải API, chuyển tiếp xuống React fallback
};

app.get('/:collection', checkCollection, authenticateToken, async (req, res) => {
  try {
    const docs = await getDocuments(req.params.collection, req.query);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/:collection', checkCollection, authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || `gen_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    data.id = id;
    
    // Optional: hash password if creating a new user via API
    if (req.params.collection === 'users' && data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    await insertDocument(req.params.collection, id, data);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/:collection/:id', checkCollection, authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    data.id = req.params.id;
    if (req.params.collection === 'users' && data.password && !data.password.startsWith('$2b$')) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await updateDocument(req.params.collection, req.params.id, data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/:collection/:id', checkCollection, authenticateToken, async (req, res) => {
  try {
    db.get(`SELECT data FROM documents WHERE id = ? AND collection = ?`, [req.params.id, req.params.collection], async (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Not found' });

      const existingData = JSON.parse(row.data);
      const updatedData = { ...existingData, ...req.body, id: req.params.id };
      if (req.params.collection === 'users' && updatedData.password && updatedData.password !== existingData.password && !updatedData.password.startsWith('$2b$')) {
        updatedData.password = await bcrypt.hash(updatedData.password, 10);
      }
      await updateDocument(req.params.collection, req.params.id, updatedData);
      res.json(updatedData);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/:collection/:id', checkCollection, authenticateToken, async (req, res) => {
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
