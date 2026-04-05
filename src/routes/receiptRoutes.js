const express = require('express');
const router = express.Router();
const {
  getSaleReceipt,
  getOrderReceipt,
  sendDigitalReceipt,
  getGiftReceipt,
  getTaxInvoice
} = require('../controllers/receiptController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Receipt generation
router.get('/sale/:saleId', authorize('admin', 'branch_manager', 'cashier'), getSaleReceipt);
router.get('/order/:orderId', authorize('admin', 'branch_manager', 'whatsapp_sales'), getOrderReceipt);
router.get('/gift/:type/:id', authorize('admin', 'branch_manager', 'cashier', 'whatsapp_sales'), getGiftReceipt);
router.get('/tax-invoice/:type/:id', authorize('admin', 'branch_manager'), getTaxInvoice);

// Digital receipt delivery
router.post('/send', authorize('admin', 'branch_manager', 'cashier', 'whatsapp_sales'), sendDigitalReceipt);

module.exports = router;
