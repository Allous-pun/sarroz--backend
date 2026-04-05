const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    name: {
      type: String,
      default: 'Walk-in Customer'
    },
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    }
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    sku: String,
    variant: {
      type: Map,
      of: String,
      default: new Map()
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'fixed'
  },
  tax: {
    amount: {
      type: Number,
      default: 0
    },
    rate: {
      type: Number,
      default: 0
    },
    name: {
      type: String,
      default: 'VAT'
    }
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa', 'bank_transfer', 'credit'],
    required: true
  },
  mpesaReceipt: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  saleType: {
    type: String,
    enum: ['retail', 'wholesale'],
    default: 'retail'
  },
  notes: {
    type: String,
    default: ''
  },
  refundedAt: Date,
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Unique index on branch + invoiceNumber
saleSchema.index({ branch: 1, invoiceNumber: 1 }, { unique: true });

// Other indexes for queries
saleSchema.index({ branch: 1, createdAt: -1 });
saleSchema.index({ user: 1, createdAt: -1 });
saleSchema.index({ 'customer.phone': 1 });

module.exports = mongoose.model('Sale', saleSchema);
