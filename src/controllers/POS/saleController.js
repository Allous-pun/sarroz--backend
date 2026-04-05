const saleService = require('../../services/POS/saleService');
const GlobalSettings = require('../../models/GlobalSettings');
const { validateCreateSale, validateRefund } = require('../../validators/saleValidator');

// Helper function to get branch ID from user or request
const getBranchId = (req, isAdmin) => {
  if (isAdmin) {
    return req.body.branchId || req.query.branchId;
  }
  // For non-admin, get branch from user object (handles both populated and unpopulated)
  return req.user.branch?._id || req.user.branch;
};

// @desc    Create a new sale
// @route   POST /api/sales
// @access  Private (Cashier, Branch Manager, Admin)
const createSale = async (req, res) => {
  try {
    const errors = validateCreateSale(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    // Get tax settings
    const settings = await GlobalSettings.getSettings();
    let taxAmount = 0;
    let taxRate = 0;
    let taxName = '';
    
    if (settings.tax.enabled) {
      taxRate = settings.tax.rate;
      taxName = settings.tax.name;
      
      if (!settings.tax.includedInPrice) {
        const subtotal = req.body.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice || 0), 0);
        taxAmount = subtotal * (taxRate / 100);
      }
    }
    
    const isAdmin = req.user.role === 'admin';
    const branchId = getBranchId(req, isAdmin);
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required. Please ensure you are assigned to a branch.'
      });
    }
    
    const sale = await saleService.createSale({
      ...req.body,
      branchId: branchId.toString(),
      taxAmount,
      taxRate,
      taxName
    }, req.user._id);
    
    res.status(201).json({
      success: true,
      message: 'Sale completed successfully',
      data: sale
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get sales by branch
// @route   GET /api/sales
// @access  Private (Admin, Branch Manager)
const getSales = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const isAdmin = req.user.role === 'admin';
    const branchId = getBranchId(req, isAdmin);
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    const sales = await saleService.getSalesByBranch(branchId.toString(), startDate, endDate, status);
    
    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private (Admin, Branch Manager)
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';
    const branchId = getBranchId(req, isAdmin);
    
    const sale = await saleService.getSaleById(id, branchId ? branchId.toString() : null);
    
    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get daily sales summary
// @route   GET /api/sales/summary/daily
// @access  Private (Admin, Branch Manager)
const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const isAdmin = req.user.role === 'admin';
    const branchId = getBranchId(req, isAdmin);
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    const summary = await saleService.getDailySummary(branchId.toString(), date);
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get top selling products
// @route   GET /api/sales/top-products
// @access  Private (Admin, Branch Manager)
const getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query;
    const isAdmin = req.user.role === 'admin';
    const branchId = getBranchId(req, isAdmin);
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    const topProducts = await saleService.getTopSellingProducts(branchId.toString(), parseInt(limit), parseInt(days));
    
    res.status(200).json({
      success: true,
      count: topProducts.length,
      data: topProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Refund a sale
// @route   POST /api/sales/:id/refund
// @access  Private (Admin, Branch Manager)
const refundSale = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validateRefund(req.body);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    const sale = await saleService.refundSale(id, req.body, req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'Sale refunded successfully',
      data: sale
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  getDailySummary,
  getTopSellingProducts,
  refundSale
};
