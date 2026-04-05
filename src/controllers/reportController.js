const reportService = require('../services/reportService');

// @desc    Get dashboard summary
// @route   GET /api/reports/dashboard
// @access  Private (Admin, Branch Manager)
const getDashboardSummary = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    const summary = await reportService.getDashboardSummary(branchId, parseInt(days));
    
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

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private (Admin, Branch Manager)
const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const report = await reportService.getSalesReport(branchId, startDate, endDate, groupBy);
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private (Admin, Branch Manager)
const getInventoryReport = async (req, res) => {
  try {
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    const report = await reportService.getInventoryReport(branchId);
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get customer report
// @route   GET /api/reports/customers
// @access  Private (Admin, Branch Manager)
const getCustomerReport = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    const report = await reportService.getCustomerReport(branchId, parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get profit report
// @route   GET /api/reports/profit
// @access  Private (Admin, Branch Manager)
const getProfitReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const report = await reportService.getProfitReport(branchId, startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDashboardSummary,
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
  getProfitReport
};
