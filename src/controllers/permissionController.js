const Permission = require('../models/Permission');

// @desc    Get all role permissions
// @route   GET /api/permissions
// @access  Private (Admin only)
const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find({});
    
    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get permissions for a specific role
// @route   GET /api/permissions/:role
// @access  Private (Admin only)
const getRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    
    const permissions = await Permission.findOne({ role });
    
    if (!permissions) {
      return res.status(404).json({
        success: false,
        message: `No permissions found for role: ${role}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update permissions for a role
// @route   PUT /api/permissions/:role
// @access  Private (Admin only)
const updateRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;
    
    const updatedPermissions = await Permission.findOneAndUpdate(
      { role },
      { permissions },
      { new: true, upsert: true }
    );
    
    res.status(200).json({
      success: true,
      message: `Permissions updated for ${role}`,
      data: updatedPermissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Seed default permissions
// @route   POST /api/permissions/seed
// @access  Private (Admin only)
const seedPermissions = async (req, res) => {
  try {
    const defaultPermissions = {
      admin: {
        canCreateProduct: true,
        canEditProduct: true,
        canDeleteProduct: true,
        canViewProducts: true,
        canCreateBranch: true,
        canEditBranch: true,
        canDeleteBranch: true,
        canViewBranches: true,
        canUpdateInventory: true,
        canTransferStock: true,
        canViewInventory: true,
        canProcessSale: true,
        canViewSales: true,
        canRefundSale: true,
        canCreateOrder: true,
        canUpdateOrder: true,
        canViewOrders: true,
        canCreateUser: true,
        canEditUser: true,
        canDeleteUser: true,
        canViewUsers: true,
        canViewReports: true,
        canExportReports: true,
        canEditSettings: true
      },
      branch_manager: {
        canCreateProduct: false,
        canEditProduct: false,
        canDeleteProduct: false,
        canViewProducts: true,
        canCreateBranch: false,
        canEditBranch: false,
        canDeleteBranch: false,
        canViewBranches: true,
        canUpdateInventory: true,
        canTransferStock: false,
        canViewInventory: true,
        canProcessSale: true,
        canViewSales: true,
        canRefundSale: true,
        canCreateOrder: true,
        canUpdateOrder: true,
        canViewOrders: true,
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewUsers: true,
        canViewReports: true,
        canExportReports: false,
        canEditSettings: false
      },
      cashier: {
        canCreateProduct: false,
        canEditProduct: false,
        canDeleteProduct: false,
        canViewProducts: true,
        canCreateBranch: false,
        canEditBranch: false,
        canDeleteBranch: false,
        canViewBranches: false,
        canUpdateInventory: false,
        canTransferStock: false,
        canViewInventory: true,
        canProcessSale: true,
        canViewSales: true,
        canRefundSale: false,
        canCreateOrder: false,
        canUpdateOrder: false,
        canViewOrders: false,
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewUsers: false,
        canViewReports: false,
        canExportReports: false,
        canEditSettings: false
      },
      whatsapp_sales: {
        canCreateProduct: false,
        canEditProduct: false,
        canDeleteProduct: false,
        canViewProducts: true,
        canCreateBranch: false,
        canEditBranch: false,
        canDeleteBranch: false,
        canViewBranches: false,
        canUpdateInventory: false,
        canTransferStock: false,
        canViewInventory: true,
        canProcessSale: false,
        canViewSales: false,
        canRefundSale: false,
        canCreateOrder: true,
        canUpdateOrder: true,
        canViewOrders: true,
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewUsers: false,
        canViewReports: false,
        canExportReports: false,
        canEditSettings: false
      }
    };
    
    for (const [role, permissions] of Object.entries(defaultPermissions)) {
      await Permission.findOneAndUpdate(
        { role },
        { role, permissions },
        { upsert: true, new: true }
      );
    }
    
    const allPermissions = await Permission.find({});
    
    res.status(200).json({
      success: true,
      message: 'Default permissions seeded successfully',
      data: allPermissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getPermissions,
  getRolePermissions,
  updateRolePermissions,
  seedPermissions
};