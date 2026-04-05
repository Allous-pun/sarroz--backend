const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
  updateBranchProduct,
  updateInventory,
  getLowStockProducts,
  transferStock,
  getAllStockByBranch,
  uploadProductImages,
  deleteProductImage,
  setPrimaryImage
} = require('../controllers/productManagement/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadMultipleImages } = require('../middleware/uploadMiddleware');

router.use(protect);

// Product CRUD
router.post('/', authorize('admin'), createProduct);
router.get('/', getAllProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/stock/branch', getAllStockByBranch);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProductById);
router.put('/:id', authorize('admin'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

// Product Images
router.post('/:id/images', authorize('admin'), uploadMultipleImages, uploadProductImages);
router.delete('/:id/images/:imageId', authorize('admin'), deleteProductImage);
router.put('/:id/images/:imageId/primary', authorize('admin'), setPrimaryImage);

// Branch-specific product settings
router.put('/branch/:productId', authorize('admin', 'branch_manager'), updateBranchProduct);

// Inventory management
router.put('/inventory/:productId', authorize('admin', 'branch_manager'), updateInventory);
router.post('/transfer-stock', authorize('admin'), transferStock);

module.exports = router;