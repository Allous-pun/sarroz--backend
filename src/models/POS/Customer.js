const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  location: {
    type: String,
    default: ''
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastOrderAt: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Only keep these indexes (remove phone index since unique:true creates it)
customerSchema.index({ name: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
