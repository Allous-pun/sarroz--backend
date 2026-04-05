const Sale = require('../../models/POS/Sale');
const inventoryService = require('../productManagement/inventoryService');
const BranchProduct = require('../../models/productManagement/BranchProduct');
const Product = require('../../models/productManagement/Product');

class SaleService {
  // Generate unique invoice number with atomic operation
  async generateInvoiceNumber(branchId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    // Find the last invoice for today
    const lastSale = await Sale.findOne({
      branch: branchId,
      invoiceNumber: { $regex: `^INV-${datePrefix}` }
    }).sort({ invoiceNumber: -1 });
    
    let sequence = 1;
    if (lastSale) {
      const parts = lastSale.invoiceNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]);
      sequence = lastSeq + 1;
    }
    
    const sequenceNum = String(sequence).padStart(4, '0');
    return `INV-${datePrefix}-${sequenceNum}`;
  }

  // Create a new sale
  async createSale(saleData, userId) {
    const { branchId, items, customer, paymentMethod, mpesaReceipt, discount, discountType, notes, saleType } = saleData;
    
    // Get branch-specific prices
    let subtotal = 0;
    const processedItems = [];
    
    for (const item of items) {
      // Get product details
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      // Get branch-specific selling price
      const branchProduct = await BranchProduct.findOne({
        branch: branchId,
        product: item.productId
      });
      
      const unitPrice = branchProduct?.sellingPrice || product.basePrice;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      
      processedItems.push({
        product: item.productId,
        productName: product.name,
        sku: product.sku,
        variant: item.variant || new Map(),
        quantity: item.quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice
      });
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (discount && discount > 0) {
      if (discountType === 'percentage') {
        discountAmount = subtotal * (discount / 100);
      } else {
        discountAmount = discount;
      }
    }
    
    const afterDiscount = subtotal - discountAmount;
    
    // Calculate tax (using settings - will be passed from controller)
    const taxAmount = saleData.taxAmount || 0;
    const total = afterDiscount + taxAmount;
    
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(branchId);
    
    // Create sale record
    const sale = await Sale.create({
      invoiceNumber,
      branch: branchId,
      user: userId,
      customer: {
        name: customer?.name || 'Walk-in Customer',
        phone: customer?.phone || '',
        email: customer?.email || ''
      },
      items: processedItems,
      subtotal,
      discount: discountAmount,
      discountType: discountType || 'fixed',
      tax: {
        amount: taxAmount,
        rate: saleData.taxRate || 0,
        name: saleData.taxName || 'VAT'
      },
      total,
      paymentMethod,
      mpesaReceipt: mpesaReceipt || '',
      status: 'completed',
      saleType: saleType || 'retail',
      notes: notes || ''
    });
    
    // Deduct inventory for each item
    for (const item of processedItems) {
      await inventoryService.updateStock(
        branchId,
        item.product,
        item.variant,
        item.quantity,
        userId,
        'subtract'
      );
    }
    
    return sale;
  }
  
  // Get sales by branch
  async getSalesByBranch(branchId, startDate = null, endDate = null, status = 'completed') {
    const query = { branch: branchId, status };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const sales = await Sale.find(query)
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });
    
    return sales;
  }
  
  // Get sale by ID
  async getSaleById(saleId, branchId = null) {
    const query = { _id: saleId };
    if (branchId) {
      query.branch = branchId;
    }
    
    const sale = await Sale.findOne(query)
      .populate('user', 'fullName email')
      .populate('items.product', 'name sku images');
    
    if (!sale) {
      throw new Error('Sale not found');
    }
    
    return sale;
  }
  
  // Get daily sales summary
  async getDailySummary(branchId, date = null) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
    const sales = await Sale.find({
      branch: branchId,
      status: 'completed',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const summary = {
      totalSales: sales.length,
      totalRevenue: 0,
      totalCash: 0,
      totalMpesa: 0,
      totalBank: 0,
      totalDiscount: 0,
      totalTax: 0,
      items: []
    };
    
    for (const sale of sales) {
      summary.totalRevenue += sale.total;
      summary.totalDiscount += sale.discount;
      summary.totalTax += sale.tax.amount;
      
      switch (sale.paymentMethod) {
        case 'cash':
          summary.totalCash += sale.total;
          break;
        case 'mpesa':
          summary.totalMpesa += sale.total;
          break;
        case 'bank_transfer':
          summary.totalBank += sale.total;
          break;
      }
      
      for (const item of sale.items) {
        summary.items.push({
          productName: item.productName,
          quantity: item.quantity,
          total: item.totalPrice
        });
      }
    }
    
    return summary;
  }
  
  // Refund a sale (partial or full)
  async refundSale(saleId, refundData, userId) {
    const { items, reason } = refundData;
    
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }
    
    if (sale.status === 'refunded') {
      throw new Error('Sale already refunded');
    }
    
    // Process refund for each item
    for (const refundItem of items) {
      const saleItem = sale.items.find(
        item => item.product.toString() === refundItem.productId
      );
      
      if (!saleItem) {
        throw new Error(`Item not found in original sale: ${refundItem.productId}`);
      }
      
      if (refundItem.quantity > saleItem.quantity) {
        throw new Error(`Refund quantity exceeds sold quantity for ${saleItem.productName}`);
      }
      
      // Return stock to inventory
      await inventoryService.updateStock(
        sale.branch,
        saleItem.product,
        saleItem.variant,
        refundItem.quantity,
        userId,
        'add'
      );
    }
    
    // Update sale status
    sale.status = 'refunded';
    sale.refundedAt = new Date();
    sale.refundedBy = userId;
    sale.notes = `${sale.notes || ''} Refund: ${reason || 'No reason provided'}`;
    await sale.save();
    
    return sale;
  }
  
  // Get top selling products
  async getTopSellingProducts(branchId, limit = 10, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const topProducts = await Sale.aggregate([
      {
        $match: {
          branch: branchId,
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      }
    ]);
    
    return topProducts;
  }
}

module.exports = new SaleService();
