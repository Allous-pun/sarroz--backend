const Category = require('../../models/productManagement/Category');

class CategoryService {
  async createCategory(categoryData, userId) {
    const category = await Category.create({
      ...categoryData,
      createdBy: userId
    });
    return category;
  }

  async getAllCategories(includeInactive = false) {
    const query = includeInactive ? {} : { isActive: true };
    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .sort({ name: 1 });
    return categories;
  }

  async getCategoryById(categoryId) {
    const category = await Category.findById(categoryId)
      .populate('parent', 'name slug');
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async updateCategory(categoryId, updateData) {
    // FIXED: Using returnDocument instead of new
    const category = await Category.findByIdAndUpdate(
      categoryId,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async deleteCategory(categoryId) {
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { isActive: false },
      { returnDocument: 'after' }
    );
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async getCategoryTree() {
    const categories = await Category.find({ isActive: true });
    
    const buildTree = (parentId = null) => {
      return categories
        .filter(cat => {
          if (!parentId) return !cat.parent;
          return cat.parent && cat.parent.toString() === parentId.toString();
        })
        .map(cat => ({
          ...cat.toObject(),
          children: buildTree(cat._id)
        }));
    };
    
    return buildTree();
  }

  async getCategoryAttributes(categoryId) {
    const category = await this.getCategoryById(categoryId);
    return category.attributes || [];
  }
}

module.exports = new CategoryService();