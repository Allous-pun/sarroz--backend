const Product = require('../../models/productManagement/Product');
const BranchProduct = require('../../models/productManagement/BranchProduct');
const Inventory = require('../../models/productManagement/Inventory');
const Category = require('../../models/productManagement/Category');

class ProductService {
  async createProduct(productData, userId) {
    // Verify category exists
    const category = await Category.findById(productData.category);
    if (!category) {
      throw new Error('Category not found');
    }

    const product = await Product.create({
      ...productData,
      createdBy: userId
    });
    
    if (product.isGlobal) {
      await this.createBranchProductForAllBranches(product._id);
    }
    
    return product;
  }
  
  async getAllProducts(branchId = null, filters = {}) {
    const query = { isActive: true };
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.search) {
      query.$text = { $search: filters.search };
    }
    
    const products = await Product.find(query)
      .populate('category', 'name slug attributes')
      .sort({ createdAt: -1 });
    
    if (branchId) {
      const productsWithBranchData = await Promise.all(
        products.map(async (product) => {
          const branchProduct = await BranchProduct.findOne({
            branch: branchId,
            product: product._id
          });
          
          const inventory = await Inventory.aggregate([
            {
              $match: {
                branch: branchId,
                product: product._id
              }
            },
            {
              $group: {
                _id: null,
                totalQuantity: { $sum: '$quantity' },
                totalReserved: { $sum: '$reservedQuantity' }
              }
            }
          ]);
          
          // Get all variant combinations for this product
          const variants = await Inventory.find({
            branch: branchId,
            product: product._id
          }).select('variant quantity reservedQuantity');
          
          return {
            ...product.toObject(),
            branchSellingPrice: branchProduct?.sellingPrice || product.basePrice,
            isAvailableInBranch: branchProduct?.isActive !== false,
            branchStock: inventory[0]?.totalQuantity || 0,
            branchAvailableStock: (inventory[0]?.totalQuantity || 0) - (inventory[0]?.totalReserved || 0),
            reorderLevel: branchProduct?.reorderLevel || 5,
            variants: variants
          };
        })
      );
      
      return productsWithBranchData;
    }
    
    return products;
  }
  
  async getProductById(productId, branchId = null) {
    const product = await Product.findById(productId)
      .populate('category', 'name slug attributes');
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (branchId) {
      const branchProduct = await BranchProduct.findOne({
        branch: branchId,
        product: productId
      });
      
      const inventory = await Inventory.find({
        branch: branchId,
        product: productId
      });
      
      return {
        ...product.toObject(),
        branchSellingPrice: branchProduct?.sellingPrice || product.basePrice,
        isAvailableInBranch: branchProduct?.isActive !== false,
        inventory: inventory,
        reorderLevel: branchProduct?.reorderLevel || 5
      };
    }
    
    return product;
  }
  
  async updateProduct(productId, updateData) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (updateData.category) {
      const category = await Category.findById(updateData.category);
      if (!category) {
        throw new Error('Category not found');
      }
    }
    
    Object.assign(product, updateData);
    await product.save();
    
    return product;
  }
  
  async deleteProduct(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    product.isActive = false;
    await product.save();
    
    await BranchProduct.updateMany(
      { product: productId },
      { isActive: false }
    );
    
    return product;
  }
  
  async createBranchProductForAllBranches(productId) {
    const Branch = require('../../models/Branch');
    const branches = await Branch.find({ isActive: true });
    
    const branchProducts = branches.map(branch => ({
      branch: branch._id,
      product: productId
    }));
    
    if (branchProducts.length > 0) {
      await BranchProduct.insertMany(branchProducts, { ordered: false });
    }
  }
  
  async updateBranchProduct(branchId, productId, updateData) {
  const branchProduct = await BranchProduct.findOneAndUpdate(
    { branch: branchId, product: productId },
    updateData,
    { returnDocument: 'after', upsert: true }  // Changed: new → returnDocument
  );
  return branchProduct;
  }
  
  async getLowStockProducts(branchId) {
    const lowStock = await Inventory.aggregate([
      {
        $match: { branch: branchId }
      },
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $lookup: {
          from: 'branchproducts',
          localField: '_id',
          foreignField: 'product',
          as: 'branchProduct'
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $match: {
          $expr: {
            $lt: ['$totalQuantity', { $ifNull: [{ $arrayElemAt: ['$branchProduct.reorderLevel', 0] }, 5] }]
          }
        }
      }
    ]);
    
    return lowStock;
  }

  async getProductsByCategory(categoryId, branchId = null) {
    const query = { category: categoryId, isActive: true };
    const products = await Product.find(query).populate('category', 'name slug attributes');
    
    if (branchId) {
      return this.attachBranchData(products, branchId);
    }
    
    return products;
  }
}

module.exports = new ProductService();
