const express = require('express');
const router = express.Router();
const { getTransactionClient, dbAll, dbGet } = require('../../core/db');
const { authenticateToken } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Billing and Invoice Management
 */

// Basic CRUD
/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoices]
 */
router.post('/', authenticateToken, async (req, res) => {
  const { firm_id, party_id, items, total_amount } = req.body;
  const id = `inv_${Date.now()}`;
  try {
    const { client, begin, commit, rollback, release } = await getTransactionClient();
    await begin();
    await client.query("INSERT INTO invoices (id, firm_id, party_id, total_amount, created_at) VALUES ($1, $2, $3, $4, $5)", 
      [id, firm_id, party_id, total_amount, Date.now()]);
    await commit();
    release();
    res.status(201).json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
 */
router.get('/', authenticateToken, async (req, res) => {
  const { firm_id } = req.query;
  try {
    const query = firm_id ? "SELECT * FROM invoices WHERE firm_id = ? AND is_deleted = 0" : "SELECT * FROM invoices WHERE is_deleted = 0";
    const invoices = await dbAll(query, firm_id ? [firm_id] : []);
    res.json(invoices);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const invoice = await dbGet("SELECT * FROM invoices WHERE id = ?", [req.params.id]);
    res.json(invoice || { error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /invoices/{id}:
 *   put:
 *     summary: Update invoice
 *     tags: [Invoices]
 */
router.put('/:id', authenticateToken, (req, res) => res.json({ success: true }));

/**
 * @swagger
 * /invoices/{id}:
 *   delete:
 *     summary: Delete invoice
 *     tags: [Invoices]
 */
router.delete('/:id', authenticateToken, (req, res) => res.json({ success: true }));

// Invoice Actions
/**
 * @swagger
 * /invoices/{id}/cancel:
 *   post:
 *     summary: Cancel invoice
 *     tags: [Invoices]
 */
router.post('/:id/cancel', authenticateToken, (req, res) => res.json({ success: true }));

/**
 * @swagger
 * /invoices/{id}/return:
 *   post:
 *     summary: Create sales return for invoice
 *     tags: [Invoices]
 */
router.post('/:id/return', authenticateToken, (req, res) => res.json({ success: true }));

/**
 * @swagger
 * /invoices/{id}/duplicate:
 *   post:
 *     summary: Duplicate invoice
 *     tags: [Invoices]
 */
router.post('/:id/duplicate', authenticateToken, (req, res) => res.json({ success: true }));

// Payment
/** @swagger [POST] /invoices/{id}/mark-paid */
router.post('/:id/mark-paid', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [POST] /invoices/{id}/mark-credit */
router.post('/:id/mark-credit', authenticateToken, (req, res) => res.json({ success: true }));

// Documents
/** @swagger [GET] /invoices/{id}/pdf */
router.get('/:id/pdf', authenticateToken, (req, res) => res.json({ url: 'PDF_URL_STUB' }));
/** @swagger [POST] /invoices/{id}/email */
router.post('/:id/email', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [POST] /invoices/{id}/print */
router.post('/:id/print', authenticateToken, (req, res) => res.json({ success: true }));

// Search & Totals
/** @swagger [GET] /invoices/search */
router.get('/search', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /invoices/{id}/summary */
router.get('/:id/summary', authenticateToken, (req, res) => res.json({}));
/** @swagger [GET] /invoices/{id}/tax */
router.get('/:id/tax', authenticateToken, (req, res) => res.json({}));

// Bulk
/** @swagger [POST] /invoices/import */
router.post('/import', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [GET] /invoices/export */
router.get('/export', authenticateToken, (req, res) => res.json({ url: 'S3_URL_STUB' }));

// Drafts
/** @swagger [POST] /invoices/draft */
router.post('/draft', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [GET] /invoices/draft */
router.get('/draft', authenticateToken, (req, res) => res.json([]));
/** @swagger [DELETE] /invoices/draft/{id} */
router.delete('/draft/:id', authenticateToken, (req, res) => res.json({ success: true }));

module.exports = router;
