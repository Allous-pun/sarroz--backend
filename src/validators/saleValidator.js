const validateCreateSale = (data) => {
  const errors = [];

  if (!data.items || data.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (data.items) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.productId) {
        errors.push(`Item ${i + 1}: Product ID is required`);
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Item ${i + 1}: Quantity must be at least 1`);
      }
      if (item.quantity > 999) {
        errors.push(`Item ${i + 1}: Quantity cannot exceed 999`);
      }
    }
  }

  if (!data.paymentMethod) {
    errors.push('Payment method is required');
  }

  if (data.paymentMethod === 'mpesa' && !data.mpesaReceipt) {
    errors.push('M-Pesa receipt number is required for M-Pesa payments');
  }

  if (data.discount && data.discount < 0) {
    errors.push('Discount cannot be negative');
  }

  if (data.discountType === 'percentage' && data.discount > 100) {
    errors.push('Percentage discount cannot exceed 100%');
  }

  return errors;
};

const validateRefund = (data) => {
  const errors = [];

  if (!data.saleId) {
    errors.push('Sale ID is required');
  }

  if (!data.items || data.items.length === 0) {
    errors.push('At least one item to refund is required');
  }

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    if (!item.productId) {
      errors.push(`Item ${i + 1}: Product ID is required`);
    }
    if (!item.quantity || item.quantity < 1) {
      errors.push(`Item ${i + 1}: Quantity must be at least 1`);
    }
  }

  return errors;
};

module.exports = {
  validateCreateSale,
  validateRefund
};
