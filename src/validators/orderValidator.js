const validateCreateOrder = (data) => {
  const errors = [];

  if (!data.customerName || data.customerName.trim() === '') {
    errors.push('Customer name is required');
  }

  if (!data.customerPhone || data.customerPhone.trim() === '') {
    errors.push('Customer phone number is required');
  }

  if (!data.items || data.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (data.items) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.productId && !item.productName) {
        errors.push(`Item ${i + 1}: Product name is required`);
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Item ${i + 1}: Quantity must be at least 1`);
      }
    }
  }

  return errors;
};

const validateUpdateOrderStatus = (data) => {
  const errors = [];

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!data.status || !validStatuses.includes(data.status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  return errors;
};

module.exports = {
  validateCreateOrder,
  validateUpdateOrderStatus
};
