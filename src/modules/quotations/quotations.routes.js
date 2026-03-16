const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { dbRun, dbGet, dbAll } = require('../../core/db');

/**
 * @swagger
 * tags:
 *   name: Quotations
 *   description: Estimates and Quotations
 */

// CRUD
/** @swagger [POST] /quotations */
router.post('/', authenticateToken, (req, res) => res.status(201).json({ success: true, id: 'q_123' }));
/** @swagger [GET] /quotations */
router.get('/', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /quotations/{id} */
router.get('/:id', authenticateToken, (req, res) => res.json({ id: 'q_123' }));
/** @swagger [PUT] /quotations/{id} */
router.put('/:id', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [DELETE] /quotations/{id} */
router.delete('/:id', authenticateToken, (req, res) => res.json({ success: true }));

// Conversion & Actions
/** @swagger [POST] /quotations/{id}/convert */
router.post('/:id/convert', authenticateToken, (req, res) => res.json({ success: true, invoice_id: 'inv_123' }));
/** @swagger [GET] /quotations/{id}/pdf */
router.get('/:id/pdf', authenticateToken, (req, res) => res.json({ url: 'PDF_STUB' }));
/** @swagger [POST] /quotations/{id}/email */
router.post('/:id/email', authenticateToken, (req, res) => res.json({ success: true }));

// Stats
/** @swagger [GET] /quotations/stats */
router.get('/stats', authenticateToken, (req, res) => res.json({ total: 0 }));

module.exports = router;
