const Branch = require('../models/Branch');

class BranchService {
  // Create a new branch
  async createBranch(branchData) {
    const existingBranch = await Branch.findOne({ name: branchData.name });
    if (existingBranch) {
      throw new Error('Branch with this name already exists');
    }
    return await Branch.create(branchData);
  }

  // Get all branches (Admin only)
  async getAllBranches() {
    return await Branch.find({ isActive: true });
  }

  // Get single branch by ID
  async getBranchById(branchId) {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }
    return branch;
  }

  // Update branch
  async updateBranch(branchId, updateData) {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }
    
    Object.assign(branch, updateData);
    await branch.save();
    return branch;
  }

  // Soft delete branch
  async deleteBranch(branchId) {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }
    
    branch.isActive = false;
    await branch.save();
    return branch;
  }

  // Check if user has access to a branch
  async userHasBranchAccess(user, requestedBranchId) {
    // Admin has access to all branches
    if (user.role === 'admin') return true;
    
    // If user has no branch assigned, they cannot access any branch
    if (!user.branch) return false;
    
    // Compare user's branch with requested branch
    return user.branch.toString() === requestedBranchId;
  }

  // Get branch for a user (returns null if user has no branch)
  async getUserBranch(user) {
    if (user.role === 'admin') return null; // Admin has no single branch
    if (!user.branch) return null;
    return await Branch.findById(user.branch);
  }
}

module.exports = new BranchService();
