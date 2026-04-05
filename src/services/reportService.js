const mongoose = require('mongoose');
const Sale = require('../models/POS/Sale');
const Order = require('../models/POS/Order');
const Product = require('../models/productManagement/Product');
const Inventory = require('../models/productManagement/Inventory');
const Customer = require('../models/POS/Customer');

class ReportService {
  // Helper to convert to ObjectId
  toObjectId(id) {
    try {
      return new mongoose.Types.ObjectId(id);
    } catch (e) {
      return id;
    }
  }

  // Get dashboard summary (includes both POS sales AND WhatsApp orders)
  async getDashboardSummary(branchId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const branchObjectId = this.toObjectId(branchId);
    
    // POS Sales summary
    const sales = await Sale.aggregate([
      {
        $match: {
          branch: branchObjectId,
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalCash: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$total', 0] } },
          totalMpesa: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'mpesa'] }, '$total', 0] } },
          avgOrderValue: { $avg: '$total' }
        }
      }
    ]);
    
    // WhatsApp Orders summary (include confirmed, processing, shipped, delivered, completed)
    const orders = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          status: { $in: ['confirmed', 'processing', 'shipped', 'delivered', 'completed'] },
          paymentStatus: 'paid',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          confirmedOrders: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
        }
      }
    ]);
    
    // Combine revenue from both sources
    const totalRevenue = (sales[0]?.totalRevenue || 0) + (orders[0]?.totalRevenue || 0);
    const totalTransactions = (sales[0]?.totalSales || 0) + (orders[0]?.totalOrders || 0);
    const totalCash = sales[0]?.totalCash || 0;
    const totalMpesa = (sales[0]?.totalMpesa || 0) + (orders[0]?.totalRevenue || 0);
    
    // Products summary
    const totalProducts = await Product.countDocuments({ isActive: true });
    
    // Customers summary
    const totalCustomers = await Customer.countDocuments({ branch: branchObjectId, isActive: true });
    const newCustomers = await Customer.countDocuments({
      branch: branchObjectId,
      createdAt: { $gte: startDate }
    });
    
    // Low stock products
    const lowStockCount = await Inventory.countDocuments({
      branch: branchObjectId,
      quantity: { $lte: 5, $gt: 0 }
    });
    
    return {
      period: `${days} days`,
      sales: {
        totalSales: totalTransactions,
        totalRevenue: totalRevenue,
        totalCash: totalCash,
        totalMpesa: totalMpesa,
        avgOrderValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      },
      orders: {
        totalOrders: orders[0]?.totalOrders || 0,
        pendingOrders: orders[0]?.pendingOrders || 0,
        confirmedOrders: orders[0]?.confirmedOrders || 0,
        deliveredOrders: orders[0]?.deliveredOrders || 0
      },
      products: {
        totalProducts,
        lowStockCount
      },
      customers: {
        totalCustomers,
        newCustomers
      }
    };
  }
  
  // Get sales report (includes both POS and WhatsApp orders)
  async getSalesReport(branchId, startDate, endDate, groupBy = 'day') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const branchObjectId = this.toObjectId(branchId);
    
    let dateFormat;
    if (groupBy === 'day') {
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    } else if (groupBy === 'month') {
      dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    } else {
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }
    
    // POS Sales data
    const posSalesData = await Sale.aggregate([
      {
        $match: {
          branch: branchObjectId,
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: dateFormat,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // WhatsApp Orders data (include confirmed status)
    const orderData = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          status: { $in: ['confirmed', 'processing', 'shipped', 'delivered', 'completed'] },
          paymentStatus: 'paid',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: dateFormat,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Merge both data sources
    const salesMap = new Map();
    posSalesData.forEach(item => {
      salesMap.set(item._id, { totalSales: item.totalSales, totalRevenue: item.totalRevenue });
    });
    orderData.forEach(item => {
      const existing = salesMap.get(item._id) || { totalSales: 0, totalRevenue: 0 };
      salesMap.set(item._id, {
        totalSales: existing.totalSales + item.totalOrders,
        totalRevenue: existing.totalRevenue + item.totalRevenue
      });
    });
    
    const combinedData = Array.from(salesMap.entries()).map(([date, data]) => ({
      _id: date,
      totalSales: data.totalSales,
      totalRevenue: data.totalRevenue
    })).sort((a, b) => a._id.localeCompare(b._id));
    
    // Get top selling products (from both POS and Orders)
    const posTopProducts = await Sale.aggregate([
      {
        $match: {
          branch: branchObjectId,
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
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
      }
    ]);
    
    const orderTopProducts = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          status: { $in: ['confirmed', 'processing', 'shipped', 'delivered', 'completed'] },
          paymentStatus: 'paid',
          createdAt: { $gte: start, $lte: end }
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
      }
    ]);
    
    // Merge top products
    const productMap = new Map();
    [...posTopProducts, ...orderTopProducts].forEach(item => {
      const existing = productMap.get(item._id) || { productName: item.productName, totalQuantity: 0, totalRevenue: 0 };
      productMap.set(item._id, {
        productName: item.productName,
        totalQuantity: existing.totalQuantity + item.totalQuantity,
        totalRevenue: existing.totalRevenue + item.totalRevenue
      });
    });
    
    const topProducts = Array.from(productMap.entries())
      .map(([id, data]) => ({ _id: id, ...data }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
    
    // Get sales by payment method
    const paymentMethodBreakdown = await Sale.aggregate([
      {
        $match: {
          branch: branchObjectId,
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ]);
    
    // Calculate totals
    const totalRevenue = combinedData.reduce((sum, d) => sum + d.totalRevenue, 0);
    const totalTransactions = combinedData.reduce((sum, d) => sum + d.totalSales, 0);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const dailyAverage = daysDiff > 0 ? totalRevenue / daysDiff : 0;
    
    return {
      period: { startDate, endDate },
      summary: {
        totalRevenue,
        totalTransactions,
        dailyAverage,
        paymentMethodBreakdown
      },
      dailyBreakdown: combinedData,
      topProducts
    };
  }
  
  // Get inventory report
  async getInventoryReport(branchId) {
    const branchObjectId = this.toObjectId(branchId);
    
    const inventory = await Inventory.aggregate([
      {
        $match: { branch: branchObjectId }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $group: {
          _id: '$productInfo._id',
          productName: { $first: '$productInfo.name' },
          sku: { $first: '$productInfo.sku' },
          category: { $first: '$productInfo.category' },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', { $ifNull: ['$productInfo.costPrice', 0] }] } }
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]);
    
    const lowStock = inventory.filter(item => item.totalQuantity <= 5 && item.totalQuantity > 0);
    const outOfStock = inventory.filter(item => item.totalQuantity === 0);
    
    const totalInventoryValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
    
    return {
      summary: {
        totalProducts: inventory.length,
        totalValue: totalInventoryValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length
      },
      inventory: inventory,
      lowStock: lowStock,
      outOfStock: outOfStock
    };
  }
  
  // Get customer report
  async getCustomerReport(branchId, limit = 20) {
    const branchObjectId = this.toObjectId(branchId);
    
    const customers = await Customer.find({ branch: branchObjectId, isActive: true })
      .sort({ totalSpent: -1 })
      .limit(limit);
    
    const totalCustomers = await Customer.countDocuments({ branch: branchObjectId, isActive: true });
    const totalSpent = await Customer.aggregate([
      { $match: { branch: branchObjectId, isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalSpent' } } }
    ]);
    
    const avgOrderValue = totalCustomers > 0 ? (totalSpent[0]?.total || 0) / totalCustomers : 0;
    
    return {
      summary: {
        totalCustomers,
        totalSpent: totalSpent[0]?.total || 0,
        avgOrderValue,
        topCustomers: customers
      }
    };
  }
  
  // Get profit report
  async getProfitReport(branchId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const branchObjectId = this.toObjectId(branchId);
    
    // POS Sales profit
    const posProfit = await Sale.aggregate([
      {
        $match: {
          branch: branchObjectId,
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.totalPrice' },
          totalCost: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$product.costPrice', 0] }] } }
        }
      }
    ]);
    
    // WhatsApp Orders profit (include confirmed status)
    const orderProfit = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          status: { $in: ['confirmed', 'processing', 'shipped', 'delivered', 'completed'] },
          paymentStatus: 'paid',
          createdAt: { $gte: start, $lte: end }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.totalPrice' },
          totalCost: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$product.costPrice', 0] }] } }
        }
      }
    ]);
    
    const totalRevenue = (posProfit[0]?.totalRevenue || 0) + (orderProfit[0]?.totalRevenue || 0);
    const totalCost = (posProfit[0]?.totalCost || 0) + (orderProfit[0]?.totalCost || 0);
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    return {
      period: { startDate, endDate },
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin: profitMargin.toFixed(2)
    };
  }
}

module.exports = new ReportService();