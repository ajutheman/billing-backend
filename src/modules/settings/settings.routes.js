const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: System and User Preferences
 */

/** @swagger [GET] /settings/profile */
router.get('/profile', authenticateToken, (req, res) => res.json({}));
/** @swagger [PUT] /settings/profile */
router.put('/profile', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [GET] /settings/system */
router.get('/system', authenticateToken, (req, res) => res.json({}));

module.exports = router;
