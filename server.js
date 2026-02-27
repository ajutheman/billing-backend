const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const DB_TYPE = process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' : 'sqlite';

let db;
if (DB_TYPE === 'postgres') {
  db = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log('Connected to the PostgreSQL database.');
} else {
  db = new sqlite3.Database(process.env.DATABASE_URL || './cloud_db.sqlite', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the SQLite database.');
  });
}

// Wrapper to make DB calls consistent between sqlite3 and pg
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'postgres') {
      db.query(query, params, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    } else {
      db.run(query, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    }
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'postgres') {
      db.query(query, params, (err, res) => {
        if (err) reject(err);
        else resolve(res.rows[0]);
      });
    } else {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    }
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'postgres') {
      db.query(query, params, (err, res) => {
        if (err) reject(err);
        else resolve(res.rows);
      });
    } else {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }
  });
};

// Setup Schema
const initDb = async () => {
  const usersTable = `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    created_at BIGINT
  )`;

  const partiesTable = `CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY, user_id TEXT, name TEXT, phone TEXT, email TEXT, gstin TEXT, 
    address TEXT, state TEXT, type TEXT, balance REAL, 
    updated_at BIGINT, is_deleted INTEGER DEFAULT 0
  )`;

  const itemsTable = `CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY, user_id TEXT, name TEXT, sale_price REAL, stock_quantity REAL, 
    hsn_code TEXT, tax_rate REAL, 
    updated_at BIGINT, is_deleted INTEGER DEFAULT 0
  )`;

  const invoicesTable = `CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY, user_id TEXT, invoice_number TEXT, date BIGINT, party_id TEXT, 
    total_amount REAL, updated_at BIGINT, is_deleted INTEGER DEFAULT 0
  )`;

  if (DB_TYPE === 'postgres') {
    await db.query(usersTable);
    await db.query(partiesTable);
    await db.query(itemsTable);
    await db.query(invoicesTable);
  } else {
    db.serialize(() => {
      db.run(usersTable);
      db.run(partiesTable);
      db.run(itemsTable);
      db.run(invoicesTable);
    });
  }
};

initDb();

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

  try {
    await dbRun(
      "INSERT INTO users (id, username, password, email, created_at) VALUES ($1, $2, $3, $4, $5)",
      [userId, username, hashedPassword, email, Date.now()]
    );
    res.json({ success: true, userId });
  } catch (err) {
    if (DB_TYPE === 'sqlite') {
      // SQLite uses different placeholder and error handling
      try {
        await dbRun("INSERT INTO users (id, username, password, email, created_at) VALUES (?, ?, ?, ?, ?)", [userId, username, hashedPassword, email, Date.now()]);
        return res.json({ success: true, userId });
      } catch (e) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await dbGet(
      DB_TYPE === 'postgres' ? "SELECT * FROM users WHERE username = $1" : "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Billing App Sync Server (Cloud Ready) Running');
});

// PUSH Endpoint: Mobile sends changes to Server
app.post('/sync/push', authenticateToken, async (req, res) => {
  const changes = req.body;
  const userId = req.user.userId;
  const timestamp = Date.now();

  try {
    if (DB_TYPE === 'postgres') {
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        if (changes.parties) {
          for (const p of changes.parties) {
            await client.query(
              "INSERT INTO parties (id, user_id, name, phone, email, gstin, address, state, type, balance, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO UPDATE SET name=$3, phone=$4, email=$5, gstin=$6, address=$7, state=$8, type=$9, balance=$10, updated_at=$11",
              [p.id, userId, p.name, p.phone, p.email, p.gstin, p.address, p.state, p.type, p.balance, timestamp]
            );
          }
        }

        if (changes.items) {
          for (const i of changes.items) {
            await client.query(
              "INSERT INTO items (id, user_id, name, sale_price, stock_quantity, hsn_code, tax_rate, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO UPDATE SET name=$3, sale_price=$4, stock_quantity=$5, hsn_code=$6, tax_rate=$7, updated_at=$8",
              [i.id, userId, i.name, i.sale_price, i.stock_quantity, i.hsn_code, i.tax_rate, timestamp]
            );
          }
        }

        if (changes.invoices) {
          for (const i of changes.invoices) {
            await client.query(
              "INSERT INTO invoices (id, user_id, invoice_number, date, party_id, total_amount, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET invoice_number=$3, date=$4, party_id=$5, total_amount=$6, updated_at=$7",
              [i.id, userId, i.invoice_number, i.date, i.party_id, i.total_amount, timestamp]
            );
          }
        }

        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } else {
      // SQLite Transaction handling already using wrappers or manual serialize
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");
          try {
            if (changes.parties) {
              const stmt = db.prepare("INSERT OR REPLACE INTO parties (id, user_id, name, phone, email, gstin, address, state, type, balance, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
              changes.parties.forEach(p => stmt.run(p.id, userId, p.name, p.phone, p.email, p.gstin, p.address, p.state, p.type, p.balance, timestamp));
              stmt.finalize();
            }
            if (changes.items) {
              const stmt = db.prepare("INSERT OR REPLACE INTO items (id, user_id, name, sale_price, stock_quantity, hsn_code, tax_rate, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
              changes.items.forEach(i => stmt.run(i.id, userId, i.name, i.sale_price, i.stock_quantity, i.hsn_code, i.tax_rate, timestamp));
              stmt.finalize();
            }
            if (changes.invoices) {
              const stmt = db.prepare("INSERT OR REPLACE INTO invoices (id, user_id, invoice_number, date, party_id, total_amount, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
              changes.invoices.forEach(i => stmt.run(i.id, userId, i.invoice_number, i.date, i.party_id, i.total_amount, timestamp));
              stmt.finalize();
            }
            db.run("COMMIT", err => err ? reject(err) : resolve());
          } catch (e) {
            db.run("ROLLBACK");
            reject(e);
          }
        });
      });
    }
    res.json({ success: true, server_time: timestamp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PULL Endpoint: Mobile asks for changes since `last_sync_time`
app.post('/sync/pull', authenticateToken, async (req, res) => {
  const lastSyncTime = req.body.last_sync_time || 0;
  const userId = req.user.userId;

  try {
    const q1 = DB_TYPE === 'postgres' ? "SELECT * FROM parties WHERE user_id = $1 AND updated_at > $2" : "SELECT * FROM parties WHERE user_id = ? AND updated_at > ?";
    const q2 = DB_TYPE === 'postgres' ? "SELECT * FROM items WHERE user_id = $1 AND updated_at > $2" : "SELECT * FROM items WHERE user_id = ? AND updated_at > ?";
    const q3 = DB_TYPE === 'postgres' ? "SELECT * FROM invoices WHERE user_id = $1 AND updated_at > $2" : "SELECT * FROM invoices WHERE user_id = ? AND updated_at > ?";

    const parties = await dbAll(q1, [userId, lastSyncTime]);
    const items = await dbAll(q2, [userId, lastSyncTime]);
    const invoices = await dbAll(q3, [userId, lastSyncTime]);

    res.json({ parties, items, invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with ${DB_TYPE} database`);
});
