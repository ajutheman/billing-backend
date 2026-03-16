const { Pool } = require('pg');
require('dotenv').config();

const DB_TYPE = process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' : 'sqlite';

let db;
let sqlite3;

if (DB_TYPE === 'postgres') {
  db = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log('Connected to the PostgreSQL database.');
} else {
  try {
    sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database(process.env.DATABASE_URL || './cloud_db.sqlite', (err) => {
      if (err) console.error(err.message);
      console.log('Connected to the SQLite database.');
    });
  } catch (e) {
    console.warn('SQLite3 module not found. Ensure it is installed if using SQLite.');
  }
}

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

const getTransactionClient = async () => {
    if (DB_TYPE === 'postgres') {
        const client = await db.connect();
        return {
            client,
            begin: () => client.query('BEGIN'),
            commit: () => client.query('COMMIT'),
            rollback: () => client.query('ROLLBACK'),
            release: () => client.release(),
            isPostgres: true
        };
    } else {
        return {
            client: db,
            begin: () => new Promise((res, rej) => db.run("BEGIN TRANSACTION", (err) => err ? rej(err) : res())),
            commit: () => new Promise((res, rej) => db.run("COMMIT", (err) => err ? rej(err) : res())),
            rollback: () => new Promise((res, rej) => db.run("ROLLBACK", (err) => err ? rej(err) : res())),
            release: () => {}, // No-op for sqlite
            isPostgres: false
        };
    }
}

// Setup Schema
const initDb = async () => {
  const firmsTable = `CREATE TABLE IF NOT EXISTS firms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT, phone TEXT, email TEXT, gstin TEXT, pan_number TEXT,
    logo_path TEXT, signature_path TEXT, financial_year TEXT, invoice_theme TEXT,
    bank_name TEXT, account_number TEXT, ifsc_code TEXT, bank_branch TEXT, upi_id TEXT,
    terms_conditions TEXT, default_notes TEXT, gst_type TEXT DEFAULT 'REGULAR',
    created_at BIGINT, updated_at BIGINT
  )`;

  const usersTable = `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    pin TEXT,
    role TEXT,
    firm_ids TEXT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    created_at BIGINT,
    updated_at BIGINT,
    is_active INTEGER DEFAULT 1
  )`;

  const partiesTable = `CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY, 
    firm_id TEXT,
    name TEXT NOT NULL, 
    phone TEXT, email TEXT, contact_person TEXT,
    gstin TEXT, pan_number TEXT,
    address TEXT, state TEXT, shipping_address TEXT,
    type TEXT NOT NULL, 
    credit_limit REAL, credit_days INTEGER,
    opening_balance REAL DEFAULT 0.0,
    balance REAL DEFAULT 0.0, 
    updated_at BIGINT, created_at BIGINT,
    is_deleted INTEGER DEFAULT 0
  )`;

  const itemsTable = `CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY, 
    firm_id TEXT,
    name TEXT NOT NULL, 
    description TEXT, hsn_code TEXT, sku TEXT, unit TEXT, category TEXT, brand TEXT,
    mrp REAL, purchase_price REAL, sale_price REAL NOT NULL, wholesale_price REAL, dealer_price REAL,
    tax_rate REAL DEFAULT 0.0, is_tax_inclusive INTEGER DEFAULT 0,
    stock_quantity REAL DEFAULT 0.0, opening_stock REAL DEFAULT 0.0, low_stock_limit REAL, rack_location TEXT,
    image_path TEXT,
    updated_at BIGINT, created_at BIGINT,
    is_deleted INTEGER DEFAULT 0
  )`;

  const invoicesTable = `CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY, 
    firm_id TEXT,
    invoice_number TEXT NOT NULL, 
    date BIGINT NOT NULL, due_date BIGINT,
    party_id TEXT, party_name TEXT, party_gstin TEXT, place_of_supply TEXT,
    type TEXT NOT NULL, status TEXT,
    subtotal REAL, discount_amount REAL, round_off_amount REAL,
    total_cgst REAL DEFAULT 0.0, total_sgst REAL DEFAULT 0.0, total_igst REAL DEFAULT 0.0,
    total_tax_amount REAL, total_amount REAL NOT NULL, balance_due REAL,
    notes TEXT, po_number TEXT, vehicle_number TEXT, eway_bill_number TEXT, transport_name TEXT,
    updated_at BIGINT, created_at BIGINT,
    is_deleted INTEGER DEFAULT 0
  )`;

  const invoiceItemsTable = `CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    item_id TEXT,
    item_name TEXT NOT NULL,
    hsn_code TEXT,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    discount_percent REAL DEFAULT 0.0,
    discount_amount REAL DEFAULT 0.0,
    tax_rate REAL,
    is_tax_inclusive INTEGER DEFAULT 0,
    cgst_amount REAL DEFAULT 0.0,
    sgst_amount REAL DEFAULT 0.0,
    igst_amount REAL DEFAULT 0.0,
    total_amount REAL NOT NULL,
    batch_id TEXT,
    batch_number TEXT
  )`;

  const accountsTable = `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, firm_id TEXT, name TEXT NOT NULL, type TEXT NOT NULL, 
    account_number TEXT, balance REAL DEFAULT 0.0, is_default INTEGER DEFAULT 0,
    created_at BIGINT, updated_at BIGINT, is_deleted INTEGER DEFAULT 0
  )`;

  const transactionsTable = `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY, firm_id TEXT, party_id TEXT, invoice_id TEXT, account_id TEXT,
    amount REAL NOT NULL, type TEXT NOT NULL, mode TEXT, date BIGINT NOT NULL, notes TEXT,
    created_at BIGINT, updated_at BIGINT, is_deleted INTEGER DEFAULT 0
  )`;

  const expenseCategoriesTable = `CREATE TABLE IF NOT EXISTS expense_categories (
    id TEXT PRIMARY KEY, firm_id TEXT, name TEXT NOT NULL, type TEXT DEFAULT 'EXPENSE',
    is_active INTEGER DEFAULT 1, updated_at BIGINT, is_deleted INTEGER DEFAULT 0
  )`;

  const expensesTable = `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY, firm_id TEXT, category_id TEXT, amount REAL NOT NULL,
    date BIGINT NOT NULL, payment_mode TEXT, notes TEXT, related_bill_id TEXT, 
    receipt_path TEXT, created_at BIGINT, updated_at BIGINT, is_deleted INTEGER DEFAULT 0
  )`;

  const godownsTable = `CREATE TABLE IF NOT EXISTS godowns (
    id TEXT PRIMARY KEY, firm_id TEXT, name TEXT NOT NULL, location TEXT, is_default INTEGER DEFAULT 0,
    created_at BIGINT, updated_at BIGINT, is_deleted INTEGER DEFAULT 0
  )`;

  const itemStockTable = `CREATE TABLE IF NOT EXISTS item_stock (
    item_id TEXT NOT NULL, godown_id TEXT NOT NULL, quantity REAL DEFAULT 0,
    updated_at BIGINT, PRIMARY KEY (item_id, godown_id)
  )`;

  const itemBatchesTable = `CREATE TABLE IF NOT EXISTS item_batches (
    id TEXT PRIMARY KEY, firm_id TEXT, item_id TEXT, godown_id TEXT, 
    batch_number TEXT NOT NULL, expiry_date BIGINT, quantity REAL DEFAULT 0, mrp REAL,
    created_at BIGINT, updated_at BIGINT, is_deleted INTEGER DEFAULT 0
  )`;

  const rolesTable = `CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, created_at BIGINT
  )`;

  const permissionsTable = `CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, module TEXT NOT NULL
  )`;

  const rolePermissionsTable = `CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT, permission_id TEXT, PRIMARY KEY (role_id, permission_id)
  )`;

  const sessionsTable = `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, user_id TEXT, token TEXT, device_info TEXT, 
    ip_address TEXT, expires_at BIGINT, created_at BIGINT
  )`;

  const quotationsTable = `CREATE TABLE IF NOT EXISTS quotations (
    id TEXT PRIMARY KEY, firm_id TEXT, quotation_number TEXT NOT NULL, 
    date BIGINT NOT NULL, party_id TEXT, party_name TEXT, 
    total_amount REAL NOT NULL, status TEXT DEFAULT 'DRAFT', 
    updated_at BIGINT, created_at BIGINT, is_deleted INTEGER DEFAULT 0
  )`;

  const quotationItemsTable = `CREATE TABLE IF NOT EXISTS quotation_items (
    id TEXT PRIMARY KEY, quotation_id TEXT NOT NULL, item_id TEXT, 
    item_name TEXT NOT NULL, quantity REAL NOT NULL, unit_price REAL NOT NULL, total_amount REAL NOT NULL
  )`;

  const paymentModesTable = `CREATE TABLE IF NOT EXISTS payment_modes (
    id TEXT PRIMARY KEY, firm_id TEXT, name TEXT NOT NULL, is_active INTEGER DEFAULT 1
  )`;

  const categoriesTable = `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, firm_id TEXT, name TEXT NOT NULL, is_deleted INTEGER DEFAULT 0
  )`;

  const brandsTable = `CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY, firm_id TEXT, name TEXT NOT NULL, is_deleted INTEGER DEFAULT 0
  )`;

  const auditLogsTable = `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY, user_id TEXT, action TEXT, module TEXT, details TEXT, timestamp BIGINT
  )`;

  const systemSettingsTable = `CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY, value TEXT, updated_at BIGINT
  )`;

  // Event Driven Schema modifications
  const eventLogsTable = `CREATE TABLE IF NOT EXISTS event_logs (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at BIGINT,
    processed_at BIGINT
  )`;

  const tables = [
    firmsTable, usersTable, partiesTable, itemsTable, 
    invoicesTable, invoiceItemsTable, accountsTable, transactionsTable,
    expenseCategoriesTable, expensesTable, godownsTable, itemStockTable, itemBatchesTable,
    rolesTable, permissionsTable, rolePermissionsTable, sessionsTable,
    quotationsTable, quotationItemsTable, paymentModesTable, categoriesTable, brandsTable,
    auditLogsTable, systemSettingsTable,
    eventLogsTable
  ];

  if (DB_TYPE === 'postgres') {
    for (const table of tables) {
      await db.query(table);
    }
  } else {
    db.serialize(() => {
      for (const table of tables) {
        db.run(table);
      }
    });
  }
};

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
  initDb,
  getTransactionClient,
  DB_TYPE
};
