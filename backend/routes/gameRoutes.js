const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

/**
 * @route   GET /api/games
 * @desc    Get all available games
 * @access  Private
 */
router.get('/', gameController.getGames);

/**
 * @route   POST /api/games/session
 * @desc    Record game session
 * @access  Private
 */
router.post('/session', gameController.recordGameSession);

/**
 * @route   GET /api/games/child/:childId/sessions
 * @desc    Get game sessions for a child
 * @access  Private
 */
router.get('/child/:childId/sessions', gameController.getChildGameSessions);

/**
 * @route   GET /api/games/child/:childId/stats
 * @desc    Get game statistics for a child
 * @access  Private
 */
router.get('/child/:childId/stats', gameController.getGameStats);

module.exports = router;
