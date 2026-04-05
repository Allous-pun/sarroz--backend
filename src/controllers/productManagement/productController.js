const productService = require('../../services/productManagement/productService');
const inventoryService = require('../../services/productManagement/inventoryService');
const cloudinary = require('../../config/cloudinary');
const Product = require('../../models/productManagement/Product');
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateUpdateInventory
} = require('../../validators/productValidator');

const createProduct = async (req, res) => {
  try {
    const errors = validateCreateProduct(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    const product = await productService.createProduct(req.body, req.user._id);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    const products = await productService.getAllProducts(branchId, { category, search });
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    const product = await productService.getProductById(id, branchId);
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    const products = await productService.getProductsByCategory(categoryId, branchId);
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const errors = validateUpdateProduct(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    const product = await productService.updateProduct(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Product deactivated successfully'
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

const updateBranchProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const branchId = req.user.role === 'admin' ? req.body.branchId : req.user.branch;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    const branchProduct = await productService.updateBranchProduct(branchId, productId, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Branch product settings updated',
      data: branchProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variant, quantity, operation, batchNumber, expiryDate } = req.body;
    const branchId = req.user.role === 'admin' ? req.body.branchId : req.user.branch;
    
    const errors = validateUpdateInventory(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    const inventory = await inventoryService.updateStock(
      branchId, productId, variant, quantity, req.user._id, operation || 'set', batchNumber, expiryDate
    );
    
    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: inventory
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    const lowStockProducts = await productService.getLowStockProducts(branchId);
    
    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      data: lowStockProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const transferStock = async (req, res) => {
  try {
    const { fromBranchId, toBranchId, productId, variant, quantity } = req.body;
    
    await inventoryService.transferStock(
      fromBranchId, toBranchId, productId, variant, quantity, req.user._id
    );
    
    res.status(200).json({
      success: true,
      message: 'Stock transferred successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAllStockByBranch = async (req, res) => {
  try {
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branch;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }
    
    const stock = await inventoryService.getAllStockByBranch(branchId);
    
    res.status(200).json({
      success: true,
      count: stock.length,
      data: stock
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private (Admin only)
const uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }
    
    const images = req.files.map((file, index) => ({
      url: file.path,
      publicId: file.filename,
      isPrimary: index === 0 && product.images.length === 0
    }));
    
    product.images.push(...images);
    await product.save();
    
    res.status(200).json({
      success: true,
      message: `${images.length} image(s) uploaded successfully`,
      data: product.images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private (Admin only)
const deleteProductImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const image = product.images.id(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Delete from Cloudinary
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }
    
    image.deleteOne();
    await product.save();
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Set primary image
// @route   PUT /api/products/:id/images/:imageId/primary
// @access  Private (Admin only)
const setPrimaryImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Set all images to isPrimary false
    product.images.forEach(img => {
      img.isPrimary = false;
    });
    
    // Set selected image to primary
    const image = product.images.id(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    image.isPrimary = true;
    await product.save();
    
    res.status(200).json({
      success: true,
      message: 'Primary image set successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
  updateBranchProduct,
  updateInventory,
  getLowStockProducts,
  transferStock,
  getAllStockByBranch,
  uploadProductImages,
  deleteProductImage,
  setPrimaryImage
};