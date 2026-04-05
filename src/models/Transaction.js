const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  merchantRequestID: {
    type: String,
    required: true,
    unique: true
  },
  checkoutRequestID: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  accountReference: {
    type: String,
    required: true
  },
  transactionDescription: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Success', 'Failed', 'Cancelled'],
    default: 'Pending'
  },
  mpesaReceiptNumber: {
    type: String,
    default: null
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  resultCode: {
    type: Number,
    default: null
  },
  resultDesc: {
    type: String,
    default: null
  },
  lastMpesaQuery: {
    type: Date,
    default: null
  },
  queryAttempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
