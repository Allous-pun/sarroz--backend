const Inventory = require('../../models/productManagement/Inventory');

class InventoryService {
  async updateStock(branchId, productId, variant, quantity, userId, operation = 'set', batchNumber = null, expiryDate = null) {
    const variantObj = variant || {};
    
    // Sort keys for consistent matching
    const sortedVariant = {};
    Object.keys(variantObj).sort().forEach(key => {
      sortedVariant[key] = variantObj[key];
    });
    const variantKey = JSON.stringify(sortedVariant);
    
    let inventory = await Inventory.findOne({
      branch: branchId,
      product: productId,
      variantKey: variantKey,
      batchNumber: batchNumber || null
    });
    
    if (!inventory) {
      inventory = new Inventory({
        branch: branchId,
        product: productId,
        variant: variantObj,
        quantity: 0,
        batchNumber: batchNumber || null,
        expiryDate: expiryDate || null
      });
    } else {
      inventory.variant = variantObj;
    }
    
    if (operation === 'add') {
      inventory.quantity += quantity;
    } else if (operation === 'subtract') {
      if (inventory.quantity < quantity) {
        throw new Error(`Insufficient stock. Available: ${inventory.quantity}`);
      }
      inventory.quantity -= quantity;
    } else {
      inventory.quantity = quantity;
    }
    
    inventory.lastUpdatedBy = userId;
    await inventory.save();
    
    return inventory;
  }
  
  async reserveStock(branchId, productId, variant, quantity) {
    const variantObj = variant || {};
    const sortedVariant = {};
    Object.keys(variantObj).sort().forEach(key => {
      sortedVariant[key] = variantObj[key];
    });
    const variantKey = JSON.stringify(sortedVariant);
    
    const inventory = await Inventory.findOne({
      branch: branchId,
      product: productId,
      variantKey: variantKey
    });
    
    if (!inventory || inventory.quantity - inventory.reservedQuantity < quantity) {
      throw new Error(`Insufficient stock to reserve. Available: ${inventory?.quantity - inventory?.reservedQuantity || 0}`);
    }
    
    inventory.reservedQuantity += quantity;
    await inventory.save();
    
    return inventory;
  }
  
  async releaseReservedStock(branchId, productId, variant, quantity) {
    const variantObj = variant || {};
    const sortedVariant = {};
    Object.keys(variantObj).sort().forEach(key => {
      sortedVariant[key] = variantObj[key];
    });
    const variantKey = JSON.stringify(sortedVariant);
    
    const inventory = await Inventory.findOne({
      branch: branchId,
      product: productId,
      variantKey: variantKey
    });
    
    if (!inventory) {
      return null;
    }
    
    inventory.reservedQuantity = Math.max(0, inventory.reservedQuantity - quantity);
    await inventory.save();
    
    return inventory;
  }
  
  async getProductStockSummary(productId) {
    const stockSummary = await Inventory.aggregate([
      {
        $match: { product: productId }
      },
      {
        $group: {
          _id: '$branch',
          totalQuantity: { $sum: '$quantity' },
          totalReserved: { $sum: '$reservedQuantity' },
          availableQuantity: { $sum: { $subtract: ['$quantity', '$reservedQuantity'] } }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch'
        }
      },
      {
        $unwind: '$branch'
      }
    ]);
    
    return stockSummary;
  }
  
  async getVariantStock(productId, variant) {
    const variantObj = variant || {};
    const sortedVariant = {};
    Object.keys(variantObj).sort().forEach(key => {
      sortedVariant[key] = variantObj[key];
    });
    const variantKey = JSON.stringify(sortedVariant);
    
    const stock = await Inventory.find({
      product: productId,
      variantKey: variantKey
    }).populate('branch', 'name location');
    
    return stock;
  }
  
  async transferStock(fromBranchId, toBranchId, productId, variant, quantity, userId) {
    await this.updateStock(fromBranchId, productId, variant, quantity, userId, 'subtract');
    await this.updateStock(toBranchId, productId, variant, quantity, userId, 'add');
    
    return { success: true, message: 'Stock transferred successfully' };
  }

  async getAllStockByBranch(branchId) {
    const stock = await Inventory.find({ branch: branchId })
      .populate('product', 'name sku basePrice category')
      .sort({ updatedAt: -1 });
    
    return stock;
  }
}

module.exports = new InventoryService();