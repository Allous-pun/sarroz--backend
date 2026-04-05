const Sale = require('../models/POS/Sale');
const Order = require('../models/POS/Order');
const GlobalSettings = require('../models/GlobalSettings');
const { generateReceiptHTML, generateGiftReceiptHTML, generateTaxInvoiceHTML } = require('../templates/receiptTemplate');
const pdfGenerator = require('../utils/pdfGenerator');

class ReceiptService {
  // Helper to convert Map variant to plain object
  convertVariant(variant) {
    if (!variant) return null;
    if (variant instanceof Map) {
      return Object.fromEntries(variant);
    }
    return variant;
  }

  // Generate receipt for a sale
  async generateSaleReceipt(saleId, receiptType = 'standard', branchId = null) {
    const query = { _id: saleId };
    if (branchId) query.branch = branchId;
    
    const sale = await Sale.findOne(query)
      .populate('branch', 'name location phone')
      .populate('user', 'fullName');
    
    if (!sale) {
      throw new Error('Sale not found');
    }
    
    const settings = await GlobalSettings.getSettings();
    
    const receiptData = {
      receiptNumber: sale.invoiceNumber,
      date: sale.createdAt,
      customer: sale.customer,
      items: sale.items.map(item => ({
        name: item.productName,
        variant: this.convertVariant(item.variant),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.totalPrice
      })),
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      paymentReference: sale.mpesaReceipt || null,
      notes: sale.notes,
      businessInfo: settings.business
    };
    
    let html;
    if (receiptType === 'gift') {
      html = generateGiftReceiptHTML(receiptData, settings);
    } else if (receiptType === 'tax_invoice') {
      html = generateTaxInvoiceHTML(receiptData, settings);
    } else {
      html = generateReceiptHTML(receiptData, settings);
    }
    
    return { html, data: receiptData };
  }
  
  // Generate receipt for an order (WhatsApp)
  async generateOrderReceipt(orderId, receiptType = 'standard', branchId = null) {
    const query = { _id: orderId };
    if (branchId) query.branch = branchId;
    
    const order = await Order.findOne(query)
      .populate('branch', 'name location phone')
      .populate('customer', 'name phone email');
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    const settings = await GlobalSettings.getSettings();
    
    const receiptData = {
      receiptNumber: order.orderNumber,
      date: order.createdAt,
      customer: order.customerInfo,
      items: order.items.map(item => ({
        name: item.productName,
        variant: this.convertVariant(item.variant),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.totalPrice
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      tax: { amount: 0, rate: 0, name: 'VAT' },
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentReference: order.mpesaReceipt || null,
      notes: order.notes,
      deliveryFee: order.deliveryFee,
      remainingBalance: order.paymentStatus === 'partial' ? order.total - (order.mpesaReceipt ? order.total : 0) : 0,
      businessInfo: settings.business
    };
    
    let html;
    if (receiptType === 'gift') {
      html = generateGiftReceiptHTML(receiptData, settings);
    } else if (receiptType === 'tax_invoice') {
      html = generateTaxInvoiceHTML(receiptData, settings);
    } else {
      html = generateReceiptHTML(receiptData, settings);
    }
    
    return { html, data: receiptData };
  }
  
  // Generate PDF receipt
  async generatePDFReceipt(html, options = {}) {
    return await pdfGenerator.generatePDF(html, options);
  }
  
  // Send digital receipt via email (placeholder - integrate with email service)
  async sendDigitalReceipt(email, html, receiptType = 'standard') {
    // This would integrate with nodemailer or email service
    console.log(`Sending ${receiptType} receipt to ${email}`);
    // TODO: Implement email sending
    return { success: true, message: 'Receipt sent via email' };
  }
  
  // Send digital receipt via SMS (placeholder - integrate with SMS service)
  async sendSMSReceipt(phone, message) {
    // This would integrate with SMS gateway (Africa's Talking, Twilio, etc.)
    console.log(`Sending receipt SMS to ${phone}`);
    // TODO: Implement SMS sending
    return { success: true, message: 'Receipt sent via SMS' };
  }
}

module.exports = new ReceiptService();
