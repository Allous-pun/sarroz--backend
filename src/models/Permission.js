const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'branch_manager', 'cashier', 'whatsapp_sales']
  },
  permissions: {
    // Product permissions
    canCreateProduct: { type: Boolean, default: false },
    canEditProduct: { type: Boolean, default: false },
    canDeleteProduct: { type: Boolean, default: false },
    canViewProducts: { type: Boolean, default: true },
    
    // Branch permissions
    canCreateBranch: { type: Boolean, default: false },
    canEditBranch: { type: Boolean, default: false },
    canDeleteBranch: { type: Boolean, default: false },
    canViewBranches: { type: Boolean, default: true },
    
    // Inventory permissions
    canUpdateInventory: { type: Boolean, default: false },
    canTransferStock: { type: Boolean, default: false },
    canViewInventory: { type: Boolean, default: true },
    
    // Sales permissions
    canProcessSale: { type: Boolean, default: false },
    canViewSales: { type: Boolean, default: true },
    canRefundSale: { type: Boolean, default: false },
    
    // Order permissions (WhatsApp)
    canCreateOrder: { type: Boolean, default: false },
    canUpdateOrder: { type: Boolean, default: false },
    canViewOrders: { type: Boolean, default: true },
    
    // User permissions
    canCreateUser: { type: Boolean, default: false },
    canEditUser: { type: Boolean, default: false },
    canDeleteUser: { type: Boolean, default: false },
    canViewUsers: { type: Boolean, default: false },
    
    // Report permissions
    canViewReports: { type: Boolean, default: false },
    canExportReports: { type: Boolean, default: false },
    
    // Settings permissions
    canEditSettings: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Permission', permissionSchema);