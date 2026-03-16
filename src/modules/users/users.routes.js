const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { dbRun, dbGet, dbAll } = require('../../core/db');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User Management & HR Controls
 */

// Basic User CRUD
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 */
router.post('/', authenticateToken, async (req, res) => {
  const { username, email, role_id } = req.body;
  const id = `user_${Date.now()}`;
  try {
    await dbRun("INSERT INTO users (id, username, email, created_at) VALUES (?, ?, ?, ?)", [id, username, email, Date.now()]);
    res.status(201).json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await dbAll("SELECT id, username, email, created_at FROM users");
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** @swagger [GET] /users/{id} */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet("SELECT id, username, email FROM users WHERE id = ?", [req.params.id]);
    res.json(user || { error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** @swagger [PUT] /users/{id} */
router.put('/:id', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [DELETE] /users/{id} */
router.delete('/:id', authenticateToken, (req, res) => res.json({ success: true }));

// Roles & Permissions
/** @swagger [GET] /roles */
router.get('/roles', authenticateToken, (req, res) => res.json([]));
/** @swagger [POST] /roles */
router.post('/roles', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [PUT] /roles/{id} */
router.put('/roles/:id', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [DELETE] /roles/{id} */
router.delete('/roles/:id', authenticateToken, (req, res) => res.json({ success: true }));

/** @swagger [GET] /permissions */
router.get('/permissions', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /users/{id}/permissions */
router.get('/:id/permissions', authenticateToken, (req, res) => res.json([]));
/** @swagger [PUT] /users/{id}/permissions */
router.put('/:id/permissions', authenticateToken, (req, res) => res.json({ success: true }));

// Activity & Status
/** @swagger [GET] /users/{id}/activity */
router.get('/:id/activity', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /users/{id}/login-history */
router.get('/:id/login-history', authenticateToken, (req, res) => res.json([]));
/** @swagger [POST] /users/{id}/lock */
router.post('/:id/lock', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [POST] /users/{id}/unlock */
router.post('/:id/unlock', authenticateToken, (req, res) => res.json({ success: true }));

// Salary & HR
/** @swagger [GET] /users/{id}/salary */
router.get('/:id/salary', authenticateToken, (req, res) => res.json({ amount: 0 }));
/** @swagger [POST] /users/{id}/salary */
router.post('/:id/salary', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [GET] /users/{id}/attendance */
router.get('/:id/attendance', authenticateToken, (req, res) => res.json([]));
/** @swagger [POST] /users/{id}/attendance */
router.post('/:id/attendance', authenticateToken, (req, res) => res.json({ success: true }));

// Device Tracking
/** @swagger [GET] /users/{id}/devices */
router.get('/:id/devices', authenticateToken, (req, res) => res.json([]));
/** @swagger [DELETE] /users/{id}/devices/{device_id} */
router.delete('/:id/devices/:device_id', authenticateToken, (req, res) => res.json({ success: true }));

module.exports = router;
