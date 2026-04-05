const receiptService = require('../services/receiptService');

// @desc    Generate printable receipt for a sale
// @route   GET /api/receipts/sale/:saleId
// @access  Private (Admin, Branch Manager, Cashier)
const getSaleReceipt = async (req, res) => {
  try {
    const { saleId } = req.params;
    const { type = 'standard', format = 'html' } = req.query;
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    const { html, data } = await receiptService.generateSaleReceipt(saleId, type, branchId);
    
    if (format === 'pdf') {
      const pdf = await receiptService.generatePDFReceipt(html, { format: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt-${data.receiptNumber}.pdf`);
      return res.send(pdf);
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate printable receipt for an order (WhatsApp)
// @route   GET /api/receipts/order/:orderId
// @access  Private (Admin, Branch Manager, WhatsApp Sales)
const getOrderReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { type = 'standard', format = 'html' } = req.query;
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    const { html, data } = await receiptService.generateOrderReceipt(orderId, type, branchId);
    
    if (format === 'pdf') {
      const pdf = await receiptService.generatePDFReceipt(html, { format: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt-${data.receiptNumber}.pdf`);
      return res.send(pdf);
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send digital receipt via email/SMS
// @route   POST /api/receipts/send
// @access  Private (Admin, Branch Manager, Cashier, WhatsApp Sales)
const sendDigitalReceipt = async (req, res) => {
  try {
    const { type, id, receiptType, method, destination } = req.body;
    
    let html, data;
    
    if (type === 'sale') {
      const result = await receiptService.generateSaleReceipt(id, receiptType);
      html = result.html;
      data = result.data;
    } else if (type === 'order') {
      const result = await receiptService.generateOrderReceipt(id, receiptType);
      html = result.html;
      data = result.data;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid receipt type. Must be "sale" or "order"'
      });
    }
    
    let result;
    if (method === 'email') {
      result = await receiptService.sendDigitalReceipt(destination, html, receiptType);
    } else if (method === 'sms') {
      // For SMS, send a short summary instead of full HTML
      const smsMessage = `${data.receiptNumber} | Total: ${settings.general.currency} ${data.total} | Thank you!`;
      result = await receiptService.sendSMSReceipt(destination, smsMessage);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery method. Must be "email" or "sms"'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Receipt sent via ${method} to ${destination}`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate gift receipt (no prices shown)
// @route   GET /api/receipts/gift/:type/:id
// @access  Private (Admin, Branch Manager, Cashier, WhatsApp Sales)
const getGiftReceipt = async (req, res) => {
  try {
    const { type, id } = req.params;
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    let html;
    if (type === 'sale') {
      const result = await receiptService.generateSaleReceipt(id, 'gift', branchId);
      html = result.html;
    } else if (type === 'order') {
      const result = await receiptService.generateOrderReceipt(id, 'gift', branchId);
      html = result.html;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "sale" or "order"'
      });
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate tax invoice (detailed for B2B)
// @route   GET /api/receipts/tax-invoice/:type/:id
// @access  Private (Admin, Branch Manager)
const getTaxInvoice = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { format = 'html' } = req.query;
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    let html, data;
    if (type === 'sale') {
      const result = await receiptService.generateSaleReceipt(id, 'tax_invoice', branchId);
      html = result.html;
      data = result.data;
    } else if (type === 'order') {
      const result = await receiptService.generateOrderReceipt(id, 'tax_invoice', branchId);
      html = result.html;
      data = result.data;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "sale" or "order"'
      });
    }
    
    if (format === 'pdf') {
      const pdf = await receiptService.generatePDFReceipt(html, { format: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=tax-invoice-${data.receiptNumber}.pdf`);
      return res.send(pdf);
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getSaleReceipt,
  getOrderReceipt,
  sendDigitalReceipt,
  getGiftReceipt,
  getTaxInvoice
};
