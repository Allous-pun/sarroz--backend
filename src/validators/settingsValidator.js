const validateGeneralSettings = (data) => {
  const errors = [];
  
  if (data.currency && typeof data.currency !== 'string') {
    errors.push('Currency must be a string');
  }
  
  if (data.currencySymbolPosition && !['before', 'after'].includes(data.currencySymbolPosition)) {
    errors.push('Currency symbol position must be "before" or "after"');
  }
  
  if (data.dateFormat && !['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].includes(data.dateFormat)) {
    errors.push('Invalid date format');
  }
  
  return errors;
};

const validateTaxSettings = (data) => {
  const errors = [];
  
  if (data.rate !== undefined && (data.rate < 0 || data.rate > 100)) {
    errors.push('Tax rate must be between 0 and 100');
  }
  
  return errors;
};

const validateReceiptSettings = (data) => {
  const errors = [];
  
  if (data.receiptType && !['cash_register', 'digital', 'gift_receipt', 'tax_invoice'].includes(data.receiptType)) {
    errors.push('Invalid receipt type');
  }
  
  if (data.paperSize && !['58mm', '80mm', 'A4'].includes(data.paperSize)) {
    errors.push('Invalid paper size');
  }
  
  return errors;
};

module.exports = {
  validateGeneralSettings,
  validateTaxSettings,
  validateReceiptSettings
};
