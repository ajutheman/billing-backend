const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: System
 *   description: Backend and Database Health
 */

/** @swagger [GET] /system/health */
router.get('/health', (req, res) => res.json({ status: 'UP', timestamp: Date.now() }));
/** @swagger [POST] /system/backup */
router.post('/backup', authenticateToken, (req, res) => res.json({ success: true }));

module.exports = router;
