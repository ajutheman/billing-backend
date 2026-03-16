const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Security and Change Logs
 */

/** @swagger [GET] /audit/logs */
router.get('/logs', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /audit/events */
router.get('/events', authenticateToken, (req, res) => res.json([]));

module.exports = router;
