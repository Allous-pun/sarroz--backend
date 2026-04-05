const categoryService = require('../../services/productManagement/categoryService');
const {
  validateCreateCategory,
  validateUpdateCategory
} = require('../../validators/categoryValidator');

const createCategory = async (req, res) => {
  try {
    const errors = validateCreateCategory(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    const category = await categoryService.createCategory(req.body, req.user._id);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const categories = await categoryService.getAllCategories(includeInactive === 'true');
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getCategoryTree = async (req, res) => {
  try {
    const tree = await categoryService.getCategoryTree();
    
    res.status(200).json({
      success: true,
      data: tree
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

const getCategoryAttributes = async (req, res) => {
  try {
    const attributes = await categoryService.getCategoryAttributes(req.params.id);
    
    res.status(200).json({
      success: true,
      data: attributes
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const errors = validateUpdateCategory(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    const category = await categoryService.updateCategory(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryTree,
  getCategoryById,
  getCategoryAttributes,
  updateCategory,
  deleteCategory
};
