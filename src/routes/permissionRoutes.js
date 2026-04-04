const express = require('express');
const router = express.Router();
const {
  getPermissions,
  getRolePermissions,
  updateRolePermissions,
  seedPermissions
} = require('../controllers/permissionController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All permission routes require admin access
router.use(protect, authorize('admin'));

router.get('/', getPermissions);
router.get('/:role', getRolePermissions);
router.put('/:role', updateRolePermissions);
router.post('/seed', seedPermissions);

module.exports = router;
