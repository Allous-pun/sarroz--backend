const mongoose = require('mongoose');

const branchProductSchema = new mongoose.Schema({
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
  sellingPrice: {
    type: Number,
    default: null,
    description: 'Null means use product.basePrice'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reorderLevel: {
    type: Number,
    default: 5
  },
  reorderQuantity: {
    type: Number,
    default: 20
  }
}, {
  timestamps: true
});

branchProductSchema.index({ branch: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('BranchProduct', branchProductSchema);
