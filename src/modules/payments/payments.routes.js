const { authenticateToken } = require('../../middleware/auth');
const { dbRun, dbGet, dbAll } = require('../../core/db');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment tracking and Payment modes
 */

// CRUD
/** @swagger [POST] /payments */
router.post('/', authenticateToken, (req, res) => res.status(201).json({ success: true, id: 'pay_123' }));
/** @swagger [GET] /payments */
router.get('/', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /payments/{id} */
router.get('/:id', authenticateToken, (req, res) => res.json({ id: 'pay_123' }));
/** @swagger [PUT] /payments/{id} */
router.put('/:id', authenticateToken, (req, res) => res.json({ success: true }));
/** @swagger [DELETE] /payments/{id} */
router.delete('/:id', authenticateToken, (req, res) => res.json({ success: true }));

// Filters
/** @swagger [GET] /payments/by-party */
router.get('/by-party', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /payments/by-date */
router.get('/by-date', authenticateToken, (req, res) => res.json([]));

// Modes
/** @swagger [GET] /payment-modes */
router.get('/modes', authenticateToken, (req, res) => res.json([]));
/** @swagger [POST] /payment-modes */
router.post('/modes', authenticateToken, (req, res) => res.json({ success: true }));

// Reports
/** @swagger [GET] /payments/daily */
router.get('/daily', authenticateToken, (req, res) => res.json([]));
/** @swagger [GET] /payments/pending */
router.get('/pending', authenticateToken, (req, res) => res.json([]));

module.exports = router;
