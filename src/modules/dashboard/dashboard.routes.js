const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { dbRun, dbGet, dbAll } = require('../../core/db');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Real-time Business Overview
 */

/** @swagger [GET] /dashboard/overview */
router.get('/overview', authenticateToken, (req, res) => res.json({ sales: 0, customers: 0, stock: 0 }));
/** @swagger [GET] /dashboard/charts */
router.get('/charts', authenticateToken, (req, res) => res.json({}));
/** @swagger [GET] /dashboard/alerts */
router.get('/alerts', authenticateToken, (req, res) => res.json([]));

module.exports = router;
