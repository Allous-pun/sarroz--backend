const express = require('express');
const router = express.Router();
const {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getMyBranch
} = require('../controllers/branchController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get current user's own branch (for managers, cashiers, whatsapp sales)
router.get('/my-branch', getMyBranch);

// Admin only routes
router.post('/', authorize('admin'), createBranch);
router.get('/', authorize('admin'), getAllBranches);
router.put('/:id', authorize('admin'), updateBranch);
router.delete('/:id', authorize('admin'), deleteBranch);

// Access controlled in controller (checks if user has access to this branch)
router.get('/:id', getBranchById);

module.exports = router;
