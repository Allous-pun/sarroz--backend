const mongoose = require('mongoose');

const branchSettingsSchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    unique: true
  },
  
  // Branch-specific receipt settings (override global)
  receipt: {
    header: {
      type: String,
      default: ''
    },
    footer: {
      type: String,
      default: ''
    },
    showManagerSignature: {
      type: Boolean,
      default: false
    },
    managerName: {
      type: String,
      default: ''
    }
  },
  
  // Branch operating hours
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  
  // Branch contact (override global)
  contact: {
    phone: String,
    email: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BranchSettings', branchSettingsSchema);
