const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../../core/db');
const { authenticateToken } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Inventory and Product Management
 */

// Basic CRUD
/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 */
router.post('/', authenticateToken, async (req, res) => {
  const { firm_id, name, sale_price, purchase_price } = req.body;
  const id = `item_${Date.now()}`;
  try {
    await dbRun("INSERT INTO items (id, firm_id, name, sale_price, purchase_price, created_at) VALUES (?, ?, ?, ?, ?, ?)", 
      [id, firm_id, name, sale_price, purchase_price || 0, Date.now()]);
    res.status(201).json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Get all items
 *     tags: [Items]
 */
router.get('/', authenticateToken, async (req, res) => {
  const { firm_id } = req.query;
  try {
    const query = firm_id ? "SELECT * FROM items WHERE firm_id = ? AND is_deleted = 0" : "SELECT * FROM items WHERE is_deleted = 0";
    const items = await dbAll(query, firm_id ? [firm_id] : []);
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** @swagger [GET] /items/{id} */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await dbGet("SELECT * FROM items WHERE id = ?", [req.params.id]);
    res.json(item || { error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /items/{id}:
 *   put:
 *     summary: Update item
 *     tags: [Items]
 */
router.put('/:id', authenticateToken, (req, res) => res.json({ success: true }));

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Delete item
 *     tags: [Items]
 */
router.delete('/:id', authenticateToken, (req, res) => res.json({ success: true }));

// Lookups
/** @swagger [GET] /items/barcode/{barcode} */
router.get('/barcode/:barcode', authenticateToken, (req, res) => res.json({ id: 'item_123' }));
/** @swagger [GET] /items/sku/{sku} */
router.get('/sku/:sku', authenticateToken, (req, res) => res.json({ id: 'item_123' }));

// Inventory & History
/** @swagger [GET] /items/{id}/stock */
router.get('/:id/stock', authenticateToken, (req, res) => res.json({ quantity: 10 }));
/** @swagger [GET] /items/{id}/stock/warehouse */
router.get('/:id/stock/warehouse', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /items/{id}/sales */
router.get('/:id/sales', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /items/{id}/purchases */
router.get('/:id/purchases', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /items/{id}/price-history */
router.get('/:id/price-history', authenticateToken, (req, res) => res.json([]));

// Batches
/** @swagger [GET] /items/{id}/batches */
router.get('/:id/batches', authenticateToken, (req, res) => res.json([]));
/** @swagger [POST] /items/{id}/batches */
router.post('/:id/batches', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [DELETE] /items/{id}/batches/{batch_id} */
router.delete('/:id/batches/:batch_id', authenticateToken, (req, res) => res.json({ success: true }));

// Categories & Brands
/** @swagger [POST] /categories */
router.post('/categories', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [GET] /categories */
router.get('/categories', authenticateToken, (req, res) => res.json([]));
/** @swagger [POST] /brands */
router.post('/brands', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [GET] /brands */
router.get('/brands', authenticateToken, (req, res) => res.json([]));

// Bulk
/** @swagger [POST] /items/import */
router.post('/import', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [GET] /items/export */
router.get('/export', authenticateToken, (req, res) => res.json({ url: 'S3_URL_STUB' }));

module.exports = router;
