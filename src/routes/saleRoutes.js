const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSaleById,
  getDailySummary,
  getTopSellingProducts,
  refundSale
} = require('../controllers/POS/saleController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Sale routes
router.post('/', authorize('admin', 'branch_manager', 'cashier'), createSale);
router.get('/', authorize('admin', 'branch_manager'), getSales);
router.get('/summary/daily', authorize('admin', 'branch_manager'), getDailySummary);
router.get('/top-products', authorize('admin', 'branch_manager'), getTopSellingProducts);
router.get('/:id', authorize('admin', 'branch_manager'), getSaleById);
router.post('/:id/refund', authorize('admin', 'branch_manager'), refundSale);

module.exports = router;
