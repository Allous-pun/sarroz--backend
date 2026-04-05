// Format phone number for M-Pesa (254XXXXXXXXX)
const formatPhoneNumber = (phone) => {
  let formatted = phone.toString().replace(/\s/g, '');
  
  if (formatted.startsWith('0')) {
    formatted = '254' + formatted.substring(1);
  } else if (formatted.startsWith('+')) {
    formatted = formatted.substring(1);
  } else if (!formatted.startsWith('254') && formatted.length === 10) {
    formatted = '254' + formatted.substring(1);
  }
  
  return formatted;
};

// Validate M-Pesa response
const validateMpesaResponse = (response) => {
  if (response.ResponseCode === '0') {
    return { valid: true, message: 'Success' };
  }
  
  const errorMessages = {
    '1037': 'Invalid amount. Amount must be between 1 and 150,000',
    '1032': 'Request cancelled by user',
    '1031': 'Transaction failed. Please try again',
    '1001': 'Insufficient funds',
    '1002': 'Transaction limit exceeded',
    '1003': 'Service temporarily unavailable',
    '1004': 'Invalid phone number',
    '1005': 'Invalid account reference'
  };
  
  return {
    valid: false,
    code: response.ResponseCode,
    message: errorMessages[response.ResponseCode] || response.ResponseDescription || 'Payment failed'
  };
};

module.exports = {
  formatPhoneNumber,
  validateMpesaResponse
};
