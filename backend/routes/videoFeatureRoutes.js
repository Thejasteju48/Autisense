const express = require('express');
const router = express.Router();
const videoFeatureController = require('../controllers/videoFeatureController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

/**
 * @route   POST /api/video-features/analyze
 * @desc    Receive real-time video behavior features (every 2 seconds)
 * @access  Private
 */
router.post('/analyze', videoFeatureController.analyzeVideoFeatures);

/**
 * @route   POST /api/video-features/finalize
 * @desc    Finalize analysis - combine video + questionnaire
 * @access  Private
 */
router.post('/finalize', videoFeatureController.finalizeVideoAnalysis);

module.exports = router;
