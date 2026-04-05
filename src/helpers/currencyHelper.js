const GlobalSettings = require('../models/GlobalSettings');

// Format currency based on global settings
const formatCurrency = async (amount, options = {}) => {
  const settings = await GlobalSettings.getSettings();
  const { currency, currencySymbolPosition } = settings.general;
  
  const formattedAmount = amount.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  if (currencySymbolPosition === 'before') {
    return `${currency} ${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currency}`;
  }
};

// Sync version (use when settings are already loaded)
const formatCurrencySync = (amount, settings) => {
  const { currency, currencySymbolPosition } = settings.general;
  
  const formattedAmount = amount.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  if (currencySymbolPosition === 'before') {
    return `${currency} ${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currency}`;
  }
};

// Calculate tax based on settings
const calculateTax = (subtotal, settings) => {
  if (!settings.tax.enabled) return { taxAmount: 0, total: subtotal };
  
  const { rate, includedInPrice } = settings.tax;
  
  if (includedInPrice) {
    // Tax is already included in price
    const taxAmount = subtotal - (subtotal / (1 + rate / 100));
    return {
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: subtotal,
      subtotalExcludingTax: subtotal - taxAmount
    };
  } else {
    // Tax is added on top
    const taxAmount = subtotal * (rate / 100);
    return {
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: subtotal + taxAmount,
      subtotalExcludingTax: subtotal
    };
  }
};

module.exports = {
  formatCurrency,
  formatCurrencySync,
  calculateTax
};
