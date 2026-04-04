const Permission = require('../models/Permission');

// Check if user has a specific permission
const hasPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      // Admin has all permissions
      if (req.user.role === 'admin') {
        return next();
      }

      // Get permissions for user's role
      const rolePermissions = await Permission.findOne({ role: req.user.role });
      
      if (!rolePermissions) {
        return res.status(403).json({
          success: false,
          message: 'Role permissions not configured'
        });
      }

      // Check if user has the required permission
      if (rolePermissions.permissions[permissionKey] === true) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${permissionKey.replace(/([A-Z])/g, ' $1').toLowerCase()}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

// Check if user has any of multiple permissions
const hasAnyPermission = (permissionKeys) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        return next();
      }

      const rolePermissions = await Permission.findOne({ role: req.user.role });
      
      if (!rolePermissions) {
        return res.status(403).json({
          success: false,
          message: 'Role permissions not configured'
        });
      }

      const hasAny = permissionKeys.some(key => rolePermissions.permissions[key] === true);
      
      if (hasAny) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'You don\'t have permission for this action'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

module.exports = { hasPermission, hasAnyPermission };