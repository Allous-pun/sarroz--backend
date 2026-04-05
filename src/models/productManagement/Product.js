const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  brand: {
    type: String,
    default: '',
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: 0
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: 0
  },
  unit: {
    type: String,
    default: 'piece',
    enum: ['piece', 'kg', 'gram', 'liter', 'ml', 'meter', 'box', 'pack', 'pair', 'bottle', 'each', 'dozen']
  },
  images: [{
    url: String,
    publicId: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  isGlobal: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate SKU automatically if not provided - FIXED (removed next)
productSchema.pre('save', async function() {
  if (!this.sku) {
    const count = await mongoose.model('Product').countDocuments();
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.sku = `PRD-${year}-${String(count + 1).padStart(5, '0')}-${randomNum}`;
  }
});

// Index for searching
productSchema.index({ name: 'text', description: 'text', sku: 'text', barcode: 'text' });

module.exports = mongoose.model('Product', productSchema);