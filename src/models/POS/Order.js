const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerInfo: {
    name: String,
    phone: String,
    location: String
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
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
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'cash_on_delivery', 'bank_transfer'],
    default: 'cash_on_delivery'
  },
  mpesaReceipt: {
    type: String,
    default: ''
  },
  whatsappConversation: [{
    message: String,
    direction: {
      type: String,
      enum: ['incoming', 'outgoing']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  deliveryCourier: {
    type: String,
    default: ''
  },
  trackingNumber: {
    type: String,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    enum: ['whatsapp', 'phone_call', 'facebook', 'instagram', 'tiktok'],
    default: 'whatsapp'
  }
}, {
  timestamps: true
});

// Only keep these indexes (orderNumber index is auto-created by unique:true)
orderSchema.index({ branch: 1, status: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ 'customerInfo.phone': 1 });

module.exports = mongoose.model('Order', orderSchema);
