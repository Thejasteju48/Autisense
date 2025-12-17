const { validationResult } = require('express-validator');
const Child = require('../models/Child');

/**
 * Get all children for logged in parent
 */
exports.getChildren = async (req, res) => {
  try {
    const children = await Child.find({ 
      parent: req.user._id,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: children.length,
      data: {
        children
      }
    });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get children',
      error: error.message
    });
  }
};

/**
 * Add new child
 */
exports.addChild = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, nickname, ageInMonths, gender, dateOfBirth, notes } = req.body;

    const childData = {
      parent: req.user._id,
      name,
      nickname,
      ageInMonths,
      gender,
      dateOfBirth,
      notes
    };

    // Add profile image if uploaded
    if (req.file) {
      childData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    const child = await Child.create(childData);

    res.status(201).json({
      success: true,
      message: 'Child added successfully',
      data: {
        child
      }
    });
  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add child',
      error: error.message
    });
  }
};

/**
 * Get single child
 */
exports.getChild = async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.id,
      parent: req.user._id,
      isActive: true
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    res.json({
      success: true,
      data: {
        child
      }
    });
  } catch (error) {
    console.error('Get child error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get child',
      error: error.message
    });
  }
};

/**
 * Update child information
 */
exports.updateChild = async (req, res) => {
  try {
    const { name, nickname, ageInMonths, gender, dateOfBirth, notes } = req.body;

    // Find child and verify ownership
    const child = await Child.findOne({
      _id: req.params.id,
      parent: req.user._id
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Update fields
    if (name) child.name = name;
    if (nickname !== undefined) child.nickname = nickname;
    if (ageInMonths) child.ageInMonths = ageInMonths;
    if (gender) child.gender = gender;
    if (dateOfBirth) child.dateOfBirth = dateOfBirth;
    if (notes !== undefined) child.notes = notes;

    // Update profile image if uploaded
    if (req.file) {
      child.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    await child.save();

    res.json({
      success: true,
      message: 'Child updated successfully',
      data: {
        child
      }
    });
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update child',
      error: error.message
    });
  }
};

/**
 * Delete child (soft delete)
 */
exports.deleteChild = async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.id,
      parent: req.user._id
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Soft delete
    child.isActive = false;
    await child.save();

    res.json({
      success: true,
      message: 'Child removed successfully'
    });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete child',
      error: error.message
    });
  }
};
