const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Initialize "Cloud" Database
const db = new sqlite3.Database(process.env.DATABASE_URL || './cloud_db.sqlite', (err) => {
  if (err) console.error(err.message);
  console.log('Connected to the cloud database.');
});

// Setup Schema
db.serialize(() => {
  // Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    created_at INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY, user_id TEXT, name TEXT, phone TEXT, email TEXT, gstin TEXT, 
    address TEXT, state TEXT, type TEXT, balance REAL, 
    updated_at INTEGER, is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY, user_id TEXT, name TEXT, sale_price REAL, stock_quantity REAL, 
    hsn_code TEXT, tax_rate REAL, 
    updated_at INTEGER, is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY, user_id TEXT, invoice_number TEXT, date INTEGER, party_id TEXT, 
    total_amount REAL, updated_at INTEGER, is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ENDPOINTS ---

app.post('/auth/register', async (req, res) => {
  const { username, password, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = `user_${Date.now()}`;

  db.run(
    "INSERT INTO users (id, username, password, email, created_at) VALUES (?, ?, ?, ?, ?)",
    [userId, username, hashedPassword, email, Date.now()],
    (err) => {
      if (err) return res.status(400).json({ error: 'Username already exists' });
      res.json({ success: true, userId });
    }
  );
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, userId: user.id });
  });
});

app.get('/', (req, res) => {
  res.send('Billing App Sync Server (Cloud Ready) Running');
});

// PUSH Endpoint: Mobile sends changes to Server
app.post('/sync/push', authenticateToken, (req, res) => {
  const changes = req.body; // { parties: [], items: [], invoices: [] }
  const userId = req.user.userId;
  console.log(`Received Push for user ${userId}:`, changes);

  const timestamp = Date.now();

  db.serialize(() => {
    try {
      db.run("BEGIN TRANSACTION");

      // Process Parties
      if (changes.parties) {
        const stmt = db.prepare("INSERT OR REPLACE INTO parties (id, user_id, name, phone, email, gstin, address, state, type, balance, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        changes.parties.forEach(p => {
          stmt.run(p.id, userId, p.name, p.phone, p.email, p.gstin, p.address, p.state, p.type, p.balance, timestamp);
        });
        stmt.finalize();
      }

      // Process Items
      if (changes.items) {
        const stmt = db.prepare("INSERT OR REPLACE INTO items (id, user_id, name, sale_price, stock_quantity, hsn_code, tax_rate, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        changes.items.forEach(i => {
          stmt.run(i.id, userId, i.name, i.sale_price, i.stock_quantity, i.hsn_code, i.tax_rate, timestamp);
        });
        stmt.finalize();
      }

      // Process Invoices
      if (changes.invoices) {
        const stmt = db.prepare("INSERT OR REPLACE INTO invoices (id, user_id, invoice_number, date, party_id, total_amount, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        changes.invoices.forEach(i => {
          stmt.run(i.id, userId, i.invoice_number, i.date, i.party_id, i.total_amount, timestamp);
        });
        stmt.finalize();
      }

      db.run("COMMIT");
      res.json({ success: true, server_time: timestamp });

    } catch (e) {
      db.run("ROLLBACK");
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });
});

// PULL Endpoint: Mobile asks for changes since `last_sync_time`
app.post('/sync/pull', authenticateToken, (req, res) => {
  const lastSyncTime = req.body.last_sync_time || 0;
  const userId = req.user.userId;
  console.log(`Received Pull Request for user ${userId} since:`, lastSyncTime);

  const response = { parties: [], items: [], invoices: [] };

  db.serialize(() => {
    db.all("SELECT * FROM parties WHERE user_id = ? AND updated_at > ?", [userId, lastSyncTime], (err, rows) => {
      if (err) return res.status(500).send(err);
      response.parties = rows;

      db.all("SELECT * FROM items WHERE user_id = ? AND updated_at > ?", [userId, lastSyncTime], (err, rows) => {
        if (err) return res.status(500).send(err);
        response.items = rows;

        db.all("SELECT * FROM invoices WHERE user_id = ? AND updated_at > ?", [userId, lastSyncTime], (err, rows) => {
          if (err) return res.status(500).send(err);
          response.invoices = rows;

          res.json(response);
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
