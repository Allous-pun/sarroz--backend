const mongoose = require('mongoose');
const Order = require('../../models/POS/Order');
const Customer = require('../../models/POS/Customer');
const BranchProduct = require('../../models/productManagement/BranchProduct');
const Product = require('../../models/productManagement/Product');

class OrderService {
  // Generate unique order number
  async generateOrderNumber(branchId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    const count = await Order.countDocuments({
      branch: branchId,
      createdAt: {
        $gte: new Date(year, month - 1, day),
        $lt: new Date(year, month - 1, day + 1)
      }
    });
    
    const sequence = String(count + 1).padStart(4, '0');
    return `ORD-${datePrefix}-${sequence}`;
  }

  // Create or get customer
  async getOrCreateCustomer(customerData, branchId) {
    let customer = await Customer.findOne({ phone: customerData.phone });
    
    if (!customer) {
      customer = await Customer.create({
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || '',
        location: customerData.location || '',
        branch: branchId
      });
    }
    
    return customer;
  }

  // Create a new WhatsApp order
  async createOrder(orderData, userId) {
    const { branchId, customerName, customerPhone, customerLocation, items, deliveryFee, discount, notes, source } = orderData;
    
    // Get or create customer
    const customer = await this.getOrCreateCustomer({
      name: customerName,
      phone: customerPhone,
      location: customerLocation
    }, branchId);
    
    // Calculate prices
    let subtotal = 0;
    const processedItems = [];
    
    for (const item of items) {
      let unitPrice = item.unitPrice || 0;
      let productName = item.productName;
      let productId = null;
      let sku = '';
      
      // If product exists in system, get price
      if (item.productId) {
        const product = await Product.findById(item.productId);
        if (product) {
          productName = product.name;
          sku = product.sku;
          
          const branchProduct = await BranchProduct.findOne({
            branch: branchId,
            product: item.productId
          });
          unitPrice = branchProduct?.sellingPrice || product.basePrice;
          productId = item.productId;
        }
      }
      
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      
      processedItems.push({
        product: productId,
        productName: productName,
        sku: sku,
        variant: item.variant || new Map(),
        quantity: item.quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice
      });
    }
    
    const total = subtotal + (deliveryFee || 0) - (discount || 0);
    const orderNumber = await this.generateOrderNumber(branchId);
    
    // Create order
    const order = await Order.create({
      orderNumber,
      branch: branchId,
      customer: customer._id,
      customerInfo: {
        name: customerName,
        phone: customerPhone,
        location: customerLocation || ''
      },
      items: processedItems,
      subtotal,
      deliveryFee: deliveryFee || 0,
      discount: discount || 0,
      total,
      assignedTo: userId,
      notes: notes || '',
      source: source || 'whatsapp'
    });
    
    // Update customer stats
    customer.totalOrders += 1;
    customer.totalSpent += total;
    customer.lastOrderAt = new Date();
    await customer.save();
    
    return order;
  }
  
  // Get orders by branch
  async getOrdersByBranch(branchId, filters = {}) {
    const query = { branch: branchId };
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }
    
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }
    
    const orders = await Order.find(query)
      .populate('customer', 'name phone totalOrders totalSpent')
      .populate('assignedTo', 'fullName')
      .sort({ createdAt: -1 });
    
    return orders;
  }
  
  // Get order by ID
  async getOrderById(orderId, branchId = null) {
    const query = { _id: orderId };
    if (branchId) {
      query.branch = branchId;
    }
    
    const order = await Order.findOne(query)
      .populate('customer', 'name phone location totalOrders totalSpent')
      .populate('assignedTo', 'fullName email')
      .populate('items.product', 'name sku images');
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return order;
  }
  
  // Update order status
  async updateOrderStatus(orderId, status, userId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    order.status = status;
    await order.save();
    
    return order;
  }
  
  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus, mpesaReceipt = null) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    order.paymentStatus = paymentStatus;
    if (mpesaReceipt) {
      order.mpesaReceipt = mpesaReceipt;
      order.paymentMethod = 'mpesa';
    }
    await order.save();
    
    return order;
  }
  
  // Add WhatsApp conversation log
  async addWhatsAppMessage(orderId, message, direction) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    order.whatsappConversation.push({
      message,
      direction,
      timestamp: new Date()
    });
    await order.save();
    
    return order;
  }
  
  // Get orders by customer
  async getOrdersByCustomer(customerId, branchId = null) {
    const query = { customer: customerId };
    if (branchId) {
      query.branch = branchId;
    }
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 });
    
    return orders;
  }
  
  // Get order statistics
async getOrderStatistics(branchId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await Order.aggregate([
    {
      $match: {
        branch: new mongoose.Types.ObjectId(branchId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$total' }
      }
    }
  ]);
  
  const paymentStats = await Order.aggregate([
    {
      $match: {
        branch: new mongoose.Types.ObjectId(branchId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalValue: { $sum: '$total' }
      }
    }
  ]);
  
  const totalOrders = await Order.countDocuments({
    branch: branchId,
    createdAt: { $gte: startDate }
  });
  
  const totalValueResult = await Order.aggregate([
    {
      $match: {
        branch: new mongoose.Types.ObjectId(branchId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$total' }
      }
    }
  ]);
  
  return {
    byStatus: stats,
    byPaymentStatus: paymentStats,
    totalOrders: totalOrders,
    totalValue: totalValueResult.length > 0 ? totalValueResult[0].total : 0
  };
}
}

module.exports = new OrderService();
