require('dotenv').config();

module.exports = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  baseURL: process.env.MPESA_ENVIRONMENT === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke',
  businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE || '174379',
  passkey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  callbackURL: process.env.MPESA_CALLBACK_URL || 'https://example.com/api/v1/mpesa/callback',
  transactionType: process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
  partyB: process.env.MPESA_BUSINESS_SHORTCODE || '174379',
  accountReference: process.env.MPESA_ACCOUNT_REFERENCE || 'HomelandHub',
  transactionDesc: process.env.MPESA_TRANSACTION_DESC || 'Payment for services'
};
