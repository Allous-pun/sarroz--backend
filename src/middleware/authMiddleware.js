const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // FIXED: Populate branch field so non-admin users have their branch info
    req.user = await User.findById(decoded.id).select('-password').populate('branch', '_id name location');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this resource`
      });
    }
    next();
  };
};

// Check if user has access to a specific branch
const checkBranchAccess = (req, res, next) => {
  // Admin has access to all branches
  if (req.user.role === 'admin') {
    return next();
  }

  const requestedBranchId = req.params.branchId || req.body.branchId || req.body.branch;
  
  // If no branch specified in request
  if (!requestedBranchId) {
    return next();
  }

  // Get branch ID from user (handles both populated and unpopulated)
  const userBranchId = req.user.branch?._id || req.user.branch;
  
  // Branch managers, cashiers, whatsapp_sales can only access their assigned branch
  if (userBranchId && userBranchId.toString() !== requestedBranchId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this branch'
    });
  }

  next();
};

module.exports = { protect, authorize, checkBranchAccess };
