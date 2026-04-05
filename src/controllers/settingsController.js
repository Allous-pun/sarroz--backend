const GlobalSettings = require('../models/GlobalSettings');
const BranchSettings = require('../models/BranchSettings');
const {
  validateGeneralSettings,
  validateTaxSettings,
  validateReceiptSettings
} = require('../validators/settingsValidator');

// @desc    Get global settings
// @route   GET /api/settings
// @access  Private (Admin only)
const getGlobalSettings = async (req, res) => {
  try {
    const settings = await GlobalSettings.getSettings();
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private (Admin only)
const updateGlobalSettings = async (req, res) => {
  try {
    const { general, tax, business, receipt } = req.body;
    
    // Validate settings
    if (general) {
      const generalErrors = validateGeneralSettings(general);
      if (generalErrors.length > 0) {
        return res.status(400).json({
          success: false,
          errors: generalErrors
        });
      }
    }
    
    if (tax) {
      const taxErrors = validateTaxSettings(tax);
      if (taxErrors.length > 0) {
        return res.status(400).json({
          success: false,
          errors: taxErrors
        });
      }
    }
    
    if (receipt) {
      const receiptErrors = validateReceiptSettings(receipt);
      if (receiptErrors.length > 0) {
        return res.status(400).json({
          success: false,
          errors: receiptErrors
        });
      }
    }
    
    let settings = await GlobalSettings.findOne();
    
    if (!settings) {
      settings = await GlobalSettings.create({});
    }
    
    // Update fields
    if (general) settings.general = { ...settings.general, ...general };
    if (tax) settings.tax = { ...settings.tax, ...tax };
    if (business) settings.business = { ...settings.business, ...business };
    if (receipt) settings.receipt = { ...settings.receipt, ...receipt };
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get branch settings
// @route   GET /api/settings/branch/:branchId
// @access  Private (Admin or Branch Manager)
const getBranchSettings = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    // Check access
    if (req.user.role !== 'admin' && req.user.branch?.toString() !== branchId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this branch'
      });
    }
    
    let settings = await BranchSettings.findOne({ branch: branchId });
    
    if (!settings) {
      settings = await BranchSettings.create({ branch: branchId });
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update branch settings
// @route   PUT /api/settings/branch/:branchId
// @access  Private (Admin or Branch Manager)
const updateBranchSettings = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { receipt, operatingHours, contact } = req.body;
    
    // Check access
    if (req.user.role !== 'admin' && req.user.branch?.toString() !== branchId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this branch'
      });
    }
    
    let settings = await BranchSettings.findOne({ branch: branchId });
    
    if (!settings) {
      settings = await BranchSettings.create({ branch: branchId });
    }
    
    if (receipt) settings.receipt = { ...settings.receipt, ...receipt };
    if (operatingHours) settings.operatingHours = { ...settings.operatingHours, ...operatingHours };
    if (contact) settings.contact = { ...settings.contact, ...contact };
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Branch settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get public settings (for receipt generation)
// @route   GET /api/settings/public
// @access  Public
const getPublicSettings = async (req, res) => {
  try {
    const settings = await GlobalSettings.getSettings();
    
    // Return only what's needed for receipts
    res.status(200).json({
      success: true,
      data: {
        currency: settings.general.currency,
        currencySymbolPosition: settings.general.currencySymbolPosition,
        dateFormat: settings.general.dateFormat,
        business: {
          name: settings.business.name,
          address: settings.business.address,
          phone: settings.business.phone,
          email: settings.business.email
        },
        receipt: settings.receipt,
        tax: {
          enabled: settings.tax.enabled,
          name: settings.tax.name,
          rate: settings.tax.rate
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getGlobalSettings,
  updateGlobalSettings,
  getBranchSettings,
  updateBranchSettings,
  getPublicSettings
};
