const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  addWhatsAppMessage,
  getOrderStatistics,
  getCustomers,
  getCustomerById
} = require('../controllers/POS/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Order routes - ADD 'cashier' to allowed roles for createOrder
router.post('/', authorize('admin', 'branch_manager', 'whatsapp_sales', 'cashier'), createOrder);
router.get('/', authorize('admin', 'branch_manager', 'whatsapp_sales'), getOrders);
router.get('/stats', authorize('admin', 'branch_manager'), getOrderStatistics);
router.get('/customers', authorize('admin', 'branch_manager', 'whatsapp_sales'), getCustomers);
router.get('/customers/:id', authorize('admin', 'branch_manager', 'whatsapp_sales'), getCustomerById);
router.get('/:id', authorize('admin', 'branch_manager', 'whatsapp_sales'), getOrderById);
router.put('/:id/status', authorize('admin', 'branch_manager', 'whatsapp_sales'), updateOrderStatus);
router.put('/:id/payment', authorize('admin', 'branch_manager', 'whatsapp_sales'), updatePaymentStatus);
router.post('/:id/whatsapp', authorize('admin', 'branch_manager', 'whatsapp_sales'), addWhatsAppMessage);

module.exports = router;
