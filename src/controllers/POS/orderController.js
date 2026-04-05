const orderService = require('../../services/POS/orderService');
const Customer = require('../../models/POS/Customer');
const { validateCreateOrder, validateUpdateOrderStatus } = require('../../validators/orderValidator');

// Helper function to get branch ID from user or request
const getBranchId = (req, isAdmin) => {
  if (isAdmin) {
    return req.body.branchId || req.query.branchId;
  }
  // For non-admin, get branch from user object (handles both populated and unpopulated)
  return req.user.branch?._id || req.user.branch;
};

// @desc    Create a new WhatsApp order
// @route   POST /api/orders
// @access  Private (WhatsApp Sales, Branch Manager, Admin)
const createOrder = async (req, res) => {
  try {
    const errors = validateCreateOrder(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    const isAdmin = req.user.role === 'admin';
    const branchId = getBranchId(req, isAdmin);
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required. Please ensure you are assigned to a branch.'
      });
    }
    
    const order = await orderService.createOrder({
      ...req.body,
      branchId: branchId.toString()
    }, req.user._id);
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (WhatsApp Sales, Branch Manager, Admin)
const getOrders = async (req, res) => {
  try {
    const { status, paymentStatus, startDate, endDate } = req.query;
    const isAdmin = req.user.role === 'admin';
    const branchId = getBranchId(req, isAdmin);
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    const orders = await orderService.getOrdersByBranch(branchId.toString(), {
      status,
      paymentStatus,
      startDate,
      endDate
    });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (WhatsApp Sales, Branch Manager, Admin)
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';
    const branchId = getBranchId(req, isAdmin);
    
    const order = await orderService.getOrderById(id, branchId ? branchId.toString() : null);
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (WhatsApp Sales, Branch Manager, Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const errors = validateUpdateOrderStatus(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    const order = await orderService.updateOrderStatus(id, status, req.user._id);
    
    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private (WhatsApp Sales, Branch Manager, Admin)
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, mpesaReceipt } = req.body;
    
    const order = await orderService.updatePaymentStatus(id, paymentStatus, mpesaReceipt);
    
    res.status(200).json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add WhatsApp conversation log
// @route   POST /api/orders/:id/whatsapp
// @access  Private (WhatsApp Sales, Branch Manager, Admin)
const addWhatsAppMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, direction } = req.body;
    
    const order = await orderService.addWhatsAppMessage(id, message, direction);
    
    res.status(200).json({
      success: true,
      message: 'WhatsApp message logged',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private (Branch Manager, Admin)
const getOrderStatistics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const isAdmin = req.user.role === 'admin';
    const branchId = getBranchId(req, isAdmin);
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    const stats = await orderService.getOrderStatistics(branchId.toString(), parseInt(days));
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get customers
// @route   GET /api/orders/customers
// @access  Private (WhatsApp Sales, Branch Manager, Admin)
const getCustomers = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const branchId = getBranchId(req, isAdmin);
    const query = branchId ? { branch: branchId.toString(), isActive: true } : { isActive: true };
    
    const customers = await Customer.find(query)
      .sort({ lastOrderAt: -1, totalSpent: -1 });
    
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get customer by ID with orders
// @route   GET /api/orders/customers/:id
// @access  Private (WhatsApp Sales, Branch Manager, Admin)
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';
    const branchId = getBranchId(req, isAdmin);
    
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    const orders = await orderService.getOrdersByCustomer(id, branchId ? branchId.toString() : null);
    
    res.status(200).json({
      success: true,
      data: {
        customer,
        orders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  addWhatsAppMessage,
  getOrderStatistics,
  getCustomers,
  getCustomerById
};
