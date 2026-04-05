const branchService = require('../services/branchService');

// @desc    Create a new branch
// @route   POST /api/branches
// @access  Private (Admin only)
const createBranch = async (req, res) => {
  try {
    const branch = await branchService.createBranch(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: branch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all branches (Admin only)
// @route   GET /api/branches
// @access  Private (Admin only)
const getAllBranches = async (req, res) => {
  try {
    const branches = await branchService.getAllBranches();
    
    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get branch by ID (with access control)
// @route   GET /api/branches/:id
// @access  Private (Admin or assigned branch manager)
const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has access to this branch
    const hasAccess = await branchService.userHasBranchAccess(req.user, id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this branch'
      });
    }
    
    const branch = await branchService.getBranchById(id);
    
    res.status(200).json({
      success: true,
      data: branch
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private (Admin only)
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await branchService.updateBranch(id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Branch updated successfully',
      data: branch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete branch (soft delete)
// @route   DELETE /api/branches/:id
// @access  Private (Admin only)
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    await branchService.deleteBranch(id);
    
    res.status(200).json({
      success: true,
      message: 'Branch deactivated successfully'
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user's branch
// @route   GET /api/branches/my-branch
// @access  Private (Branch managers, cashiers, whatsapp sales)
const getMyBranch = async (req, res) => {
  try {
    const branch = await branchService.getUserBranch(req.user);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'You are not assigned to any branch'
      });
    }
    
    res.status(200).json({
      success: true,
      data: branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getMyBranch
};
