const validateCreateProduct = (data) => {
  const errors = [];

  if (!data.name || data.name.trim() === '') {
    errors.push('Product name is required');
  }

  if (!data.category || data.category.trim() === '') {
    errors.push('Category is required');
  }

  if (data.basePrice === undefined || data.basePrice < 0) {
    errors.push('Base price must be a positive number');
  }

  if (data.costPrice === undefined || data.costPrice < 0) {
    errors.push('Cost price must be a positive number');
  }

  if (data.costPrice > data.basePrice) {
    errors.push('Cost price cannot be greater than base price');
  }

  return errors;
};

const validateUpdateProduct = (data) => {
  const errors = [];

  if (data.basePrice !== undefined && data.basePrice < 0) {
    errors.push('Base price must be a positive number');
  }

  if (data.costPrice !== undefined && data.costPrice < 0) {
    errors.push('Cost price must be a positive number');
  }

  if (data.costPrice !== undefined && data.basePrice !== undefined && data.costPrice > data.basePrice) {
    errors.push('Cost price cannot be greater than base price');
  }

  return errors;
};

const validateUpdateInventory = (data) => {
  const errors = [];

  if (data.quantity !== undefined && data.quantity < 0) {
    errors.push('Quantity cannot be negative');
  }

  return errors;
};

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateUpdateInventory
};
