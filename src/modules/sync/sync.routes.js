const express = require('express');
const router = express.Router();
const { dbGet, dbAll, db, DB_TYPE, getTransactionClient } = require('../../core/db');
const { authenticateToken } = require('../../middleware/auth');
const eventQueue = require('../../jobs/queues');

/**
 * @swagger
 * /sync/push:
 *   post:
 *     summary: Push offline billing data to cloud
 *     tags: [Synchronization]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoices:
 *                 type: array
 *                 items: { type: object }
 *     responses:
 *       200:
 *         description: Sync successful
 */
router.post('/push', authenticateToken, async (req, res) => {
  const changes = req.body;
  const userId = req.user.userId;
  const timestamp = Date.now();

  try {
    const trx = await getTransactionClient();
    try {
      await trx.begin();

      if (trx.isPostgres) {
        const client = trx.client;
        if (changes.firms) {
          for (const f of changes.firms) {
            await client.query(
              `INSERT INTO firms (id, name, address, phone, email, gstin, pan_number, logo_path, signature_path, financial_year, invoice_theme, bank_name, account_number, ifsc_code, bank_branch, upi_id, terms_conditions, default_notes, gst_type, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) 
               ON CONFLICT (id) DO UPDATE SET name=$2, address=$3, phone=$4, email=$5, gstin=$6, pan_number=$7, logo_path=$8, signature_path=$9, financial_year=$10, invoice_theme=$11, bank_name=$12, account_number=$13, ifsc_code=$14, bank_branch=$15, upi_id=$16, terms_conditions=$17, default_notes=$18, gst_type=$19, updated_at=$20`,
              [f.id, f.name, f.address, f.phone, f.email, f.gstin, f.pan_number, f.logo_path, f.signature_path, f.financial_year, f.invoice_theme, f.bank_name, f.account_number, f.ifsc_code, f.bank_branch, f.upi_id, f.terms_conditions, f.default_notes, f.gst_type, timestamp]
            );
          }
        }

        if (changes.parties) {
          for (const p of changes.parties) {
            await client.query(
              `INSERT INTO parties (id, firm_id, name, phone, email, contact_person, gstin, pan_number, address, state, shipping_address, type, credit_limit, credit_days, opening_balance, balance, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
               ON CONFLICT (id) DO UPDATE SET name=$3, phone=$4, email=$5, contact_person=$6, gstin=$7, pan_number=$8, address=$9, state=$10, shipping_address=$11, type=$12, credit_limit=$13, credit_days=$14, opening_balance=$15, balance=$16, updated_at=$17`,
              [p.id, p.firm_id, p.name, p.phone, p.email, p.contact_person, p.gstin, p.pan_number, p.address, p.state, p.shipping_address, p.type, p.credit_limit, p.credit_days, p.opening_balance, p.balance, timestamp]
            );
          }
        }

        if (changes.items) {
          for (const i of changes.items) {
            await client.query(
              `INSERT INTO items (id, firm_id, name, description, hsn_code, sku, unit, category, brand, mrp, purchase_price, sale_price, wholesale_price, dealer_price, tax_rate, is_tax_inclusive, stock_quantity, opening_stock, low_stock_limit, rack_location, image_path, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) 
               ON CONFLICT (id) DO UPDATE SET name=$3, description=$4, hsn_code=$5, sku=$6, unit=$7, category=$8, brand=$9, mrp=$10, purchase_price=$11, sale_price=$12, wholesale_price=$13, dealer_price=$14, tax_rate=$15, is_tax_inclusive=$16, stock_quantity=$17, opening_stock=$18, low_stock_limit=$19, rack_location=$20, image_path=$21, updated_at=$22`,
              [i.id, i.firm_id, i.name, i.description, i.hsn_code, i.sku, i.unit, i.category, i.brand, i.mrp, i.purchase_price, i.sale_price, i.wholesale_price, i.dealer_price, i.tax_rate, i.is_tax_inclusive, i.stock_quantity, i.opening_stock, i.low_stock_limit, i.rack_location, i.image_path, timestamp]
            );
          }
        }

        if (changes.invoices) {
          for (const inv of changes.invoices) {
            await client.query(
              `INSERT INTO invoices (id, firm_id, invoice_number, date, due_date, party_id, party_name, party_gstin, place_of_supply, type, status, subtotal, discount_amount, round_off_amount, total_cgst, total_sgst, total_igst, total_tax_amount, total_amount, balance_due, notes, po_number, vehicle_number, eway_bill_number, transport_name, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26) 
               ON CONFLICT (id) DO UPDATE SET invoice_number=$3, date=$4, due_date=$5, party_id=$6, party_name=$7, party_gstin=$8, place_of_supply=$9, type=$10, status=$11, subtotal=$12, discount_amount=$13, round_off_amount=$14, total_cgst=$15, total_sgst=$16, total_igst=$17, total_tax_amount=$18, total_amount=$19, balance_due=$20, notes=$21, po_number=$22, vehicle_number=$23, eway_bill_number=$24, transport_name=$25, updated_at=$26`,
              [inv.id, inv.firm_id, inv.invoice_number, inv.date, inv.due_date, inv.party_id, inv.party_name, inv.party_gstin, inv.place_of_supply, inv.type, inv.status, inv.subtotal, inv.discount_amount, inv.round_off_amount, inv.total_cgst, inv.total_sgst, inv.total_igst, inv.total_tax_amount, inv.total_amount, inv.balance_due, inv.notes, inv.po_number, inv.vehicle_number, inv.eway_bill_number, inv.transport_name, timestamp]
            );

            if (inv.items) {
              await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [inv.id]);
              for (const item of inv.items) {
                await client.query(
                  `INSERT INTO invoice_items (id, invoice_id, item_id, item_name, hsn_code, quantity, unit_price, discount_percent, discount_amount, tax_rate, is_tax_inclusive, cgst_amount, sgst_amount, igst_amount, total_amount, batch_id, batch_number) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                  [item.id || `ii_${Date.now()}_${Math.random()}`, inv.id, item.item_id, item.item_name, item.hsn_code, item.quantity, item.unit_price, item.discount_percent, item.discount_amount, item.tax_rate, item.is_tax_inclusive, item.cgst_amount, item.sgst_amount, item.igst_amount, item.total_amount, item.batch_id, item.batch_number]
                );
              }
            }

            // ADD TO EVENT STREAM
            await eventQueue.add('invoiceSync', { invoice: inv, timestamp });
          }
        }

        if (changes.accounts) {
          for (const a of changes.accounts) {
             await client.query(
              `INSERT INTO accounts (id, firm_id, name, type, account_number, balance, is_default, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
               ON CONFLICT (id) DO UPDATE SET name=$3, type=$4, account_number=$5, balance=$6, is_default=$7, updated_at=$8`,
              [a.id, a.firm_id, a.name, a.type, a.account_number, a.balance, a.is_default, timestamp]
             );
          }
        }

        if (changes.transactions) {
          for (const t of changes.transactions) {
            await client.query(
              `INSERT INTO transactions (id, firm_id, party_id, invoice_id, account_id, amount, type, mode, date, notes, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
               ON CONFLICT (id) DO UPDATE SET party_id=$3, invoice_id=$4, account_id=$5, amount=$6, type=$7, mode=$8, date=$9, notes=$10, updated_at=$11`,
              [t.id, t.firm_id, t.party_id, t.invoice_id, t.account_id, t.amount, t.type, t.mode, t.date, t.notes, timestamp]
            );
          }
        }

        if (changes.expenses) {
          for (const e of changes.expenses) {
             await client.query(
              `INSERT INTO expenses (id, firm_id, category_id, amount, date, payment_mode, notes, related_bill_id, receipt_path, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
               ON CONFLICT (id) DO UPDATE SET category_id=$3, amount=$4, date=$5, payment_mode=$6, notes=$7, related_bill_id=$8, receipt_path=$9, updated_at=$10`,
              [e.id, e.firm_id, e.category_id, e.amount, e.date, e.payment_mode, e.notes, e.related_bill_id, e.receipt_path, timestamp]
             );
          }
        }
      } else {
        const client = trx.client;
        if (changes.firms) {
          const stmt = client.prepare("INSERT OR REPLACE INTO firms (id, name, address, phone, email, gstin, pan_number, logo_path, signature_path, financial_year, invoice_theme, bank_name, account_number, ifsc_code, bank_branch, upi_id, terms_conditions, default_notes, gst_type, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
          for (const f of changes.firms) {
            await new Promise((res, rej) => stmt.run(f.id, f.name, f.address, f.phone, f.email, f.gstin, f.pan_number, f.logo_path, f.signature_path, f.financial_year, f.invoice_theme, f.bank_name, f.account_number, f.ifsc_code, f.bank_branch, f.upi_id, f.terms_conditions, f.default_notes, f.gst_type, timestamp, err => err ? rej(err) : res()));
          }
          stmt.finalize();
        }
        if (changes.parties) {
          const stmt = client.prepare("INSERT OR REPLACE INTO parties (id, firm_id, name, phone, email, contact_person, gstin, pan_number, address, state, shipping_address, type, credit_limit, credit_days, opening_balance, balance, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
          for (const p of changes.parties) {
            await new Promise((res, rej) => stmt.run(p.id, p.firm_id, p.name, p.phone, p.email, p.contact_person, p.gstin, p.pan_number, p.address, p.state, p.shipping_address, p.type, p.credit_limit, p.credit_days, p.opening_balance, p.balance, timestamp, err => err ? rej(err) : res()));
          }
          stmt.finalize();
        }
        if (changes.items) {
          const stmt = client.prepare("INSERT OR REPLACE INTO items (id, firm_id, name, description, hsn_code, sku, unit, category, brand, mrp, purchase_price, sale_price, wholesale_price, dealer_price, tax_rate, is_tax_inclusive, stock_quantity, opening_stock, low_stock_limit, rack_location, image_path, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
          for (const i of changes.items) {
            await new Promise((res, rej) => stmt.run(i.id, i.firm_id, i.name, i.description, i.hsn_code, i.sku, i.unit, i.category, i.brand, i.mrp, i.purchase_price, i.sale_price, i.wholesale_price, i.dealer_price, i.tax_rate, i.is_tax_inclusive, i.stock_quantity, i.opening_stock, i.low_stock_limit, i.rack_location, i.image_path, timestamp, err => err ? rej(err) : res()));
          }
          stmt.finalize();
        }
        if (changes.invoices) {
          const invStmt = client.prepare("INSERT OR REPLACE INTO invoices (id, firm_id, invoice_number, date, due_date, party_id, party_name, party_gstin, place_of_supply, type, status, subtotal, discount_amount, round_off_amount, total_cgst, total_sgst, total_igst, total_tax_amount, total_amount, balance_due, notes, po_number, vehicle_number, eway_bill_number, transport_name, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
          const itemStmt = client.prepare("INSERT INTO invoice_items (id, invoice_id, item_id, item_name, hsn_code, quantity, unit_price, discount_percent, discount_amount, tax_rate, is_tax_inclusive, cgst_amount, sgst_amount, igst_amount, total_amount, batch_id, batch_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
          
          for (const inv of changes.invoices) {
            await new Promise((res, rej) => invStmt.run(inv.id, inv.firm_id, inv.invoice_number, inv.date, inv.due_date, inv.party_id, inv.party_name, inv.party_gstin, inv.place_of_supply, inv.type, inv.status, inv.subtotal, inv.discount_amount, inv.round_off_amount, inv.total_cgst, inv.total_sgst, inv.total_igst, inv.total_tax_amount, inv.total_amount, inv.balance_due, inv.notes, inv.po_number, inv.vehicle_number, inv.eway_bill_number, inv.transport_name, timestamp, err => err ? rej(err) : res()));
            
            if (inv.items) {
               await new Promise((res, rej) => client.run("DELETE FROM invoice_items WHERE invoice_id = ?", [inv.id], err => err ? rej(err) : res()));
               for (const item of inv.items) {
                 await new Promise((res, rej) => itemStmt.run(item.id || `ii_${Date.now()}_${Math.random()}`, inv.id, item.item_id, item.item_name, item.hsn_code, item.quantity, item.unit_price, item.discount_percent, item.discount_amount, item.tax_rate, item.is_tax_inclusive, item.cgst_amount, item.sgst_amount, item.igst_amount, item.total_amount, item.batch_id, item.batch_number, err => err ? rej(err) : res()));
               }
            }

            // ADD TO EVENT STREAM
            await eventQueue.add('invoiceSync', { invoice: inv, timestamp });
          }
          invStmt.finalize();
          itemStmt.finalize();
        }

        if (changes.accounts) {
          const stmt = client.prepare("INSERT OR REPLACE INTO accounts (id, firm_id, name, type, account_number, balance, is_default, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
          for (const a of changes.accounts) {
            await new Promise((res, rej) => stmt.run(a.id, a.firm_id, a.name, a.type, a.account_number, a.balance, a.is_default, timestamp, err => err ? rej(err) : res()));
          }
          stmt.finalize();
        }

        if (changes.transactions) {
          const stmt = client.prepare("INSERT OR REPLACE INTO transactions (id, firm_id, party_id, invoice_id, account_id, amount, type, mode, date, notes, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
          for (const t of changes.transactions) {
            await new Promise((res, rej) => stmt.run(t.id, t.firm_id, t.party_id, t.invoice_id, t.account_id, t.amount, t.type, t.mode, t.date, t.notes, timestamp, err => err ? rej(err) : res()));
          }
          stmt.finalize();
        }

        if (changes.expenses) {
          const stmt = client.prepare("INSERT OR REPLACE INTO expenses (id, firm_id, category_id, amount, date, payment_mode, notes, related_bill_id, receipt_path, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
          for (const e of changes.expenses) {
            await new Promise((res, rej) => stmt.run(e.id, e.firm_id, e.category_id, e.amount, e.date, e.payment_mode, e.notes, e.related_bill_id, e.receipt_path, timestamp, err => err ? rej(err) : res()));
          }
          stmt.finalize();
        }
      }

      await trx.commit();      
      res.json({ success: true, server_time: timestamp });
    } catch (e) {
      await trx.rollback();
      throw e;
    } finally {
      trx.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /sync/pull:
 *   get:
 *     summary: Pull latest data from cloud
 *     tags: [Synchronization]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: last_sync
 *         schema: { type: integer }
 *         description: Timestamp of last successful sync
 *     responses:
 *       200:
 *         description: Returns updated records
 */
router.get('/pull', authenticateToken, async (req, res) => {
  const lastSyncTime = req.query.last_sync || 0;

  try {
    const qFirms = DB_TYPE === 'postgres' ? "SELECT * FROM firms WHERE updated_at > $1" : "SELECT * FROM firms WHERE updated_at > ?";
    const qParties = DB_TYPE === 'postgres' ? "SELECT * FROM parties WHERE updated_at > $1" : "SELECT * FROM parties WHERE updated_at > ?";
    const qItems = DB_TYPE === 'postgres' ? "SELECT * FROM items WHERE updated_at > $1" : "SELECT * FROM items WHERE updated_at > ?";
    const qInvoices = DB_TYPE === 'postgres' ? "SELECT * FROM invoices WHERE updated_at > $1" : "SELECT * FROM invoices WHERE updated_at > ?";
    const qAccounts = DB_TYPE === 'postgres' ? "SELECT * FROM accounts WHERE updated_at > $1" : "SELECT * FROM accounts WHERE updated_at > ?";
    const qTransactions = DB_TYPE === 'postgres' ? "SELECT * FROM transactions WHERE updated_at > $1" : "SELECT * FROM transactions WHERE updated_at > ?";
    const qExpenses = DB_TYPE === 'postgres' ? "SELECT * FROM expenses WHERE updated_at > $1" : "SELECT * FROM expenses WHERE updated_at > ?";

    const firms = await dbAll(qFirms, [lastSyncTime]);
    const parties = await dbAll(qParties, [lastSyncTime]);
    const items = await dbAll(qItems, [lastSyncTime]);
    const invoices = await dbAll(qInvoices, [lastSyncTime]);
    const accounts = await dbAll(qAccounts, [lastSyncTime]);
    const transactions = await dbAll(qTransactions, [lastSyncTime]);
    const expenses = await dbAll(qExpenses, [lastSyncTime]);

    // Attach items to invoices for a complete pull
    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      const qInvItems = DB_TYPE === 'postgres' ? "SELECT * FROM invoice_items WHERE invoice_id = $1" : "SELECT * FROM invoice_items WHERE invoice_id = ?";
      invoices[i].items = await dbAll(qInvItems, [inv.id]);
    }

    res.json({ firms, parties, items, invoices, accounts, transactions, expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
