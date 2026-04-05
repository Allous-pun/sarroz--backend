const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  attributes: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'select', 'color', 'size', 'boolean'],
      default: 'text'
    },
    options: [String],
    required: {
      type: Boolean,
      default: false
    },
    isVariant: {
      type: Boolean,
      default: true
    }
  }],
  icon: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
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

// Generate slug before saving (for new documents)
categorySchema.pre('save', function() {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
});

// Generate slug before findOneAndUpdate (for updates)
categorySchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  if (update.name) {
    const slug = update.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.setUpdate({ ...update, slug });
  }
});

module.exports = mongoose.model('Category', categorySchema);