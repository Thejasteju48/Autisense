const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const childController = require('../controllers/childController');
const { protect } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');

// All routes are protected (require authentication)
router.use(protect);

/**
 * @route   GET /api/children
 * @desc    Get all children for logged in parent
 * @access  Private
 */
router.get('/', childController.getChildren);

/**
 * @route   POST /api/children
 * @desc    Add new child
 * @access  Private
 */
router.post('/', uploadProfile, [
  body('name').trim().notEmpty().withMessage('Child name is required'),
  body('ageInMonths').isInt({ min: 12, max: 72 }).withMessage('Age must be between 12 and 72 months'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required')
], childController.addChild);

/**
 * @route   GET /api/children/:id
 * @desc    Get single child by ID
 * @access  Private
 */
router.get('/:id', childController.getChild);

/**
 * @route   PUT /api/children/:id
 * @desc    Update child information
 * @access  Private
 */
router.put('/:id', uploadProfile, childController.updateChild);

/**
 * @route   DELETE /api/children/:id
 * @desc    Delete child (soft delete)
 * @access  Private
 */
router.delete('/:id', childController.deleteChild);

module.exports = router;
