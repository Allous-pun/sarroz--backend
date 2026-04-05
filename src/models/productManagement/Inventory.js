const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  variantKey: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  batchNumber: {
    type: String,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  location: {
    type: String,
    default: null
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate variantKey before saving
inventorySchema.pre('save', function() {
  if (this.variant && typeof this.variant === 'object') {
    const sortedVariant = {};
    Object.keys(this.variant).sort().forEach(key => {
      sortedVariant[key] = this.variant[key];
    });
    this.variantKey = JSON.stringify(sortedVariant);
  } else {
    this.variantKey = '{}';
  }
});

// Unique index
inventorySchema.index(
  { branch: 1, product: 1, variantKey: 1, batchNumber: 1 }, 
  { unique: true }
);

// Query indexes
inventorySchema.index({ branch: 1, product: 1 });
inventorySchema.index({ product: 1 });

inventorySchema.virtual('availableQuantity').get(function() {
  return this.quantity - this.reservedQuantity;
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);