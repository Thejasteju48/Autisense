const GameSession = require('../models/GameSession');
const Child = require('../models/Child');

/**
 * Available games configuration
 */
const AVAILABLE_GAMES = [
  {
    id: 'eye-contact',
    name: 'Follow the Friend',
    description: 'Help the character look at different objects',
    type: 'eye-contact',
    color: '#FFB6C1',
    icon: '👀',
    ageRange: '12-72'
  },
  {
    id: 'imitation',
    name: 'Copy the Dance',
    description: 'Copy the fun movements',
    type: 'imitation',
    color: '#87CEEB',
    icon: '💃',
    ageRange: '18-72'
  },
  {
    id: 'emotion-matching',
    name: 'Happy Faces',
    description: 'Match the emotions',
    type: 'emotion-matching',
    color: '#FFD700',
    icon: '😊',
    ageRange: '24-72'
  },
  {
    id: 'gesture-mimic',
    name: 'Wave Hello',
    description: 'Show different gestures',
    type: 'gesture-mimic',
    color: '#98FB98',
    icon: '👋',
    ageRange: '18-72'
  }
];

/**
 * Get all available games
 */
exports.getGames = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        games: AVAILABLE_GAMES
      }
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get games',
      error: error.message
    });
  }
};

/**
 * Record game session
 */
exports.recordGameSession = async (req, res) => {
  try {
    const { childId, gameType, gameName, performance, observations, duration } = req.body;

    // Verify child belongs to parent
    const child = await Child.findOne({
      _id: childId,
      parent: req.user._id,
      isActive: true
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Create game session
    const gameSession = await GameSession.create({
      child: childId,
      gameType,
      gameName,
      performance,
      observations,
      duration
    });

    res.status(201).json({
      success: true,
      message: 'Game session recorded',
      data: {
        gameSession
      }
    });
  } catch (error) {
    console.error('Record game session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record game session',
      error: error.message
    });
  }
};

/**
 * Get game sessions for a child
 */
exports.getChildGameSessions = async (req, res) => {
  try {
    const { childId } = req.params;
    const { gameType, limit = 20 } = req.query;

    // Verify child belongs to parent
    const child = await Child.findOne({
      _id: childId,
      parent: req.user._id
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    const query = { child: childId };
    if (gameType) {
      query.gameType = gameType;
    }

    const sessions = await GameSession.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: sessions.length,
      data: {
        sessions
      }
    });
  } catch (error) {
    console.error('Get game sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game sessions',
      error: error.message
    });
  }
};

/**
 * Get game statistics for a child
 */
exports.getGameStats = async (req, res) => {
  try {
    const { childId } = req.params;

    // Verify child belongs to parent
    const child = await Child.findOne({
      _id: childId,
      parent: req.user._id
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Aggregate statistics
    const stats = await GameSession.aggregate([
      {
        $match: { child: child._id }
      },
      {
        $group: {
          _id: '$gameType',
          totalSessions: { $sum: 1 },
          averageScore: { $avg: '$performance.score' },
          averageAccuracy: { $avg: '$performance.accuracy' },
          totalTimeSpent: { $sum: '$duration' },
          lastPlayed: { $max: '$createdAt' }
        }
      },
      {
        $sort: { totalSessions: -1 }
      }
    ]);

    // Overall statistics
    const overall = await GameSession.aggregate([
      {
        $match: { child: child._id }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalTimeSpent: { $sum: '$duration' },
          averageScore: { $avg: '$performance.score' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byGameType: stats,
        overall: overall[0] || {
          totalSessions: 0,
          totalTimeSpent: 0,
          averageScore: 0
        }
      }
    });
  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game statistics',
      error: error.message
    });
  }
};
