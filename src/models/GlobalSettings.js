const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
  // General Settings
  general: {
    currency: {
      type: String,
      default: 'KSh',
      trim: true
    },
    currencySymbolPosition: {
      type: String,
      enum: ['before', 'after'],
      default: 'before'
    },
    timezone: {
      type: String,
      default: 'Africa/Nairobi'
    },
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY'
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '24h'
    }
  },

  // Tax Settings
  tax: {
    enabled: {
      type: Boolean,
      default: false
    },
    name: {
      type: String,
      default: 'VAT'
    },
    rate: {
      type: Number,
      default: 16,
      min: 0,
      max: 100
    },
    includedInPrice: {
      type: Boolean,
      default: true
    }
  },

  // Business Information
  business: {
    name: {
      type: String,
      required: true,
      default: 'Sarroz Shoes Collection'
    },
    address: {
      type: String,
      default: 'Shop F17, Seven Sunday Building, Eldoret'
    },
    phone: {
      type: String,
      default: '0116645583'
    },
    email: {
      type: String,
      default: 'info@sarroz.com',
      lowercase: true
    },
    taxPin: {
      type: String,
      default: ''
    },
    logoUrl: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    }
  },

  // Receipt Settings
  receipt: {
    title: {
      type: String,
      default: 'SARROZ SHOES COLLECTION'
    },
    header: {
      type: String,
      default: 'Thank you for shopping with us'
    },
    footer: {
      type: String,
      default: 'No returns after 7 days. Original receipt required.'
    },
    showBusinessAddress: {
      type: Boolean,
      default: true
    },
    showTaxBreakdown: {
      type: Boolean,
      default: true
    },
    showRemainingBalance: {
      type: Boolean,
      default: true
    },
    receiptType: {
      type: String,
      enum: ['cash_register', 'digital', 'gift_receipt', 'tax_invoice'],
      default: 'cash_register'
    },
    digitalReceiptMethod: {
      type: String,
      enum: ['email', 'sms', 'both'],
      default: 'email'
    },
    paperSize: {
      type: String,
      enum: ['58mm', '80mm', 'A4'],
      default: '80mm'
    },
    showQRCode: {
      type: Boolean,
      default: false
    },
    showSignature: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Ensure only one document exists (singleton pattern)
globalSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
