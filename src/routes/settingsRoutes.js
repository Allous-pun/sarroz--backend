const express = require('express');
const router = express.Router();
const {
  getGlobalSettings,
  updateGlobalSettings,
  getBranchSettings,
  updateBranchSettings,
  getPublicSettings
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route (no auth needed)
router.get('/public', getPublicSettings);

// Protected routes
router.use(protect);

// Global settings (admin only)
router.get('/', authorize('admin'), getGlobalSettings);
router.put('/', authorize('admin'), updateGlobalSettings);

// Branch settings
router.get('/branch/:branchId', getBranchSettings);
router.put('/branch/:branchId', updateBranchSettings);

module.exports = router;
