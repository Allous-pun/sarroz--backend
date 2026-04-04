const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getUsers,
  updateUser,
  deleteUser
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route - NO middleware (controller handles first-user logic)
router.post('/register', registerUser);

// Public route
router.post('/login', loginUser);

// Protected routes
router.get('/me', protect, getMe);

// Admin only routes (these require authentication)
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;