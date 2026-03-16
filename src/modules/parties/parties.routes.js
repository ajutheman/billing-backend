const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../../core/db');
const { authenticateToken } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Parties
 *   description: Customer and Vendor Management
 */

// Basic CRUD
/**
 * @swagger
 * /parties:
 *   post:
 *     summary: Create a new party
 *     tags: [Parties]
 */
router.post('/', authenticateToken, async (req, res) => {
  const { firm_id, name, type, phone, email } = req.body;
  const id = `party_${Date.now()}`;
  try {
    await dbRun("INSERT INTO parties (id, firm_id, name, type, phone, email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", 
      [id, firm_id, name, type, phone, email, Date.now()]);
    res.status(201).json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /parties:
 *   get:
 *     summary: Get all parties
 *     tags: [Parties]
 */
router.get('/', authenticateToken, async (req, res) => {
  const { type, firm_id } = req.query;
  try {
    let query = "SELECT * FROM parties WHERE is_deleted = 0";
    const params = [];
    if (type) { query += " AND type = ?"; params.push(type); }
    if (firm_id) { query += " AND firm_id = ?"; params.push(firm_id); }
    const parties = await dbAll(query, params);
    res.json(parties);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** @swagger [GET] /parties/{id} */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const party = await dbGet("SELECT * FROM parties WHERE id = ?", [req.params.id]);
    res.json(party || { error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /parties/{id}:
 *   put:
 *     summary: Update party
 *     tags: [Parties]
 */
router.put('/:id', authenticateToken, (req, res) => res.json({ success: true }));

/**
 * @swagger
 * /parties/{id}:
 *   delete:
 *     summary: Delete party
 *     tags: [Parties]
 */
router.delete('/:id', authenticateToken, (req, res) => res.json({ success: true }));

// Ledger & Balances
/** @swagger [GET] /parties/{id}/ledger */
router.get('/:id/ledger', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /parties/{id}/balance */
router.get('/:id/balance', authenticateToken, (req, res) => res.json({ balance: 0 }));
/** @swagger [GET] /parties/{id}/transactions */
router.get('/:id/transactions', authenticateToken, (req, res) => res.json([]));

// History
/** @swagger [GET] /parties/{id}/sales */
router.get('/:id/sales', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /parties/{id}/returns */
router.get('/:id/returns', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /parties/{id}/payments */
router.get('/:id/payments', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /parties/{id}/credit-notes */
router.get('/:id/credit-notes', authenticateToken, (req, res) => res.json([]));

// Credit Management
/** @swagger [PUT] /parties/{id}/credit-limit */
router.put('/:id/credit-limit', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [POST] /parties/{id}/block */
router.post('/:id/block', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [POST] /parties/{id}/unblock */
router.post('/:id/unblock', authenticateToken, (req, res) => res.json({ success: true }));

// Reports
/** @swagger [GET] /parties/top-customers */
router.get('/top-customers', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /parties/outstanding */
router.get('/outstanding', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /parties/inactive */
router.get('/inactive', authenticateToken, (req, res) => res.json([]));

// Bulk Operations
/** @swagger [POST] /parties/import */
router.post('/import', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [GET] /parties/export */
router.get('/export', authenticateToken, (req, res) => res.json({ url: 'S3_URL_STUB' }));

module.exports = router;
