const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
  getProfitReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Reports (Admin and Branch Manager only)
router.get('/dashboard', authorize('admin', 'branch_manager'), getDashboardSummary);
router.get('/sales', authorize('admin', 'branch_manager'), getSalesReport);
router.get('/inventory', authorize('admin', 'branch_manager'), getInventoryReport);
router.get('/customers', authorize('admin', 'branch_manager'), getCustomerReport);
router.get('/profit', authorize('admin', 'branch_manager'), getProfitReport);

module.exports = router;
