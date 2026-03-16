const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../../core/db');
const { authenticateToken } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Firms
 *   description: Multi-branch Company Management
 */

// Basic CRUD
/** @swagger [POST] /firms */
router.post('/', authenticateToken, async (req, res) => {
  const { name, address, phone, email, gstin } = req.body;
  const id = `firm_${Date.now()}`;
  try {
    await dbRun("INSERT INTO firms (id, name, address, phone, email, gstin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", 
      [id, name, address, phone, email, gstin, Date.now()]);
    res.status(201).json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** @swagger [GET] /firms */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const firms = await dbAll("SELECT * FROM firms WHERE is_deleted = 0");
    res.json(firms);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** @swagger [GET] /firms/{id} */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const firm = await dbGet("SELECT * FROM firms WHERE id = ?", [req.params.id]);
    res.json(firm || { error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** @swagger [PUT] /firms/{id} */
router.put('/:id', authenticateToken, (req, res) => res.json({ success: true }));

/** @swagger [DELETE] /firms/{id} */
router.delete('/:id', authenticateToken, (req, res) => res.json({ success: true }));

// Firm Settings
/** @swagger [GET] /firms/{id}/settings */
router.get('/:id/settings', authenticateToken, (req, res) => res.json({ theme: 'dark', currency: 'INR' }));
/** @swagger [PUT] /firms/{id}/settings */
router.put('/:id/settings', authenticateToken, (req, res) => res.json({ success: true }));

// Branches Management
/** @swagger [POST] /firms/{id}/branches */
router.post('/:id/branches', authenticateToken, (req, res) => res.json({ success: true, branch_id: 'br_123' }));
/** @swagger [GET] /firms/{id}/branches */
router.get('/:id/branches', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /firms/{id}/branches/{branch_id} */
router.get('/:id/branches/:branch_id', authenticateToken, (req, res) => res.json({ id: 'br_123' }));
/** @swagger [PUT] /firms/{id}/branches/{branch_id} */
router.put('/:id/branches/:branch_id', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [DELETE] /firms/{id}/branches/{branch_id} */
router.delete('/:id/branches/:branch_id', authenticateToken, (req, res) => res.json({ success: true }));

// Firm Users
/** @swagger [GET] /firms/{id}/users */
router.get('/:id/users', authenticateToken, (req, res) => res.json([]));
/** @swagger [POST] /firms/{id}/users */
router.post('/:id/users', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [DELETE] /firms/{id}/users/{user_id} */
router.delete('/:id/users/:user_id', authenticateToken, (req, res) => res.json({ success: true }));

// Analytics
/** @swagger [GET] /firms/{id}/stats */
router.get('/:id/stats', authenticateToken, (req, res) => res.json({ total_sales: 0, total_items: 0 }));
/** @swagger [GET] /firms/{id}/activity */
router.get('/:id/activity', authenticateToken, (req, res) => res.json([]));

module.exports = router;
