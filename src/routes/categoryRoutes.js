const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryTree,
  getCategoryById,
  getCategoryAttributes,
  updateCategory,
  deleteCategory
} = require('../controllers/productManagement/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes (no auth required for viewing)
router.get('/', getAllCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategoryById);
router.get('/:id/attributes', getCategoryAttributes);

// Admin only routes
router.post('/', protect, authorize('admin'), createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;
